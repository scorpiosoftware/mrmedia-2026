<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\Project;
use App\Models\SiteContent;
use App\Models\SiteSetting;
use App\Support\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Converts images uploaded before upload-time optimisation existed: every stored image that
 * the site references is re-encoded exactly like a new upload (ImageOptimizer — WebP, scaled
 * down; the site icon stays PNG) and its database references are repointed at the new file.
 *
 * Safe to re-run: images that are already in the right format and size are skipped.
 */
class OptimizeImagesCommand extends Command
{
    protected $signature = 'images:optimize
        {--dry-run : Show what would change without writing files or touching the database}
        {--keep-originals : Keep the old files on disk after the database points at the new ones}';

    protected $description = 'Convert existing uploaded images to optimised WebP and update their references';

    /** Folders on the public disk that hold admin uploads (the controllers\' UPLOAD_DIRs). */
    private const UPLOAD_DIRS = ['content', 'projects', 'events', 'branding'];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $disk = Storage::disk('public');

        $references = $this->collectReferences();
        $this->info(sprintf('Found %d image reference(s) in the database.', count($references)));

        // One conversion per stored file, however many fields point at it.
        $plans = [];   // old url => plan
        $rows = [];
        $bytesBefore = $bytesAfter = 0;

        foreach ($references as $ref) {
            $url = $ref['url'];
            if (array_key_exists($url, $plans)) { // skipped files are stored as null
                continue;
            }

            $relative = $this->relativePath($url);
            if ($relative === null) {
                $rows[] = [$ref['label'], $url, 'skipped — not an uploaded file', '', ''];
                $plans[$url] = null;

                continue;
            }

            if (! $disk->exists($relative)) {
                $rows[] = [$ref['label'], $relative, 'skipped — file missing on disk', '', ''];
                $plans[$url] = null;

                continue;
            }

            $absolute = $disk->path($relative);
            $dims = ImageOptimizer::dimensions($absolute);
            $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));

            if (ImageOptimizer::mime($absolute) === null || $dims === null) {
                $rows[] = [$ref['label'], $relative, 'skipped — not a supported image', '', ''];
                $plans[$url] = null;

                continue;
            }

            $isOptimised = $extension === $ref['format'] && max($dims) <= $ref['maxSide'];
            // WebP images also need their smaller srcset copies (older uploads don't have them).
            $missingVariants = $ref['format'] === 'webp'
                && collect(ImageOptimizer::variantPaths($relative))->contains(fn ($p) => ! $disk->exists($p));

            if ($isOptimised && ! $missingVariants) {
                $rows[] = [$ref['label'], $relative, 'already optimised', '', ''];
                $plans[$url] = null;

                continue;
            }

            $encoded = ImageOptimizer::encodeWithVariants($absolute, $ref['format'], $ref['maxSide']);
            if ($encoded === null) {
                $rows[] = [$ref['label'], $relative, 'FAILED — could not decode', '', ''];
                $plans[$url] = null;

                continue;
            }

            if ($isOptimised) {
                // Keep the file and its URL as-is; only add the smaller copies next to it.
                $plans[$url] = [
                    'variantsOnly' => true,
                    'old' => $relative,
                    'new' => $relative,
                    'newUrl' => $url,
                    'main' => null,
                    'variants' => $encoded['variants'],
                ];
                $rows[] = [$ref['label'], $relative, 'add smaller copies (srcset)', '', sprintf('%d×%d', ...$dims)];

                continue;
            }

            $oldSize = $disk->size($relative);
            $newRelative = dirname($relative).'/'.Str::uuid()->toString().'.'.$ref['format'];
            // Keep whatever host/prefix form the stored URL uses; only the file name changes.
            $newUrl = substr($url, 0, strrpos($url, '/') + 1).basename($newRelative);

            $plans[$url] = [
                'variantsOnly' => false,
                'old' => $relative,
                'new' => $newRelative,
                'newUrl' => $newUrl,
                'main' => $encoded['main'],
                'variants' => $encoded['variants'],
            ];

            $bytesBefore += $oldSize;
            $bytesAfter += strlen($encoded['main']);
            $rows[] = [
                $ref['label'],
                $relative,
                '→ '.basename($newRelative),
                $this->kb($oldSize).' → '.$this->kb(strlen($encoded['main'])),
                sprintf('%d×%d', ...$dims),
            ];
        }

        $this->table(['Used by', 'File', 'Result', 'Size', 'Original px'], $rows);

        $todo = array_filter($plans);
        if ($todo === []) {
            $this->info('Nothing to convert — all images are already optimised.');

            return self::SUCCESS;
        }

        $converting = array_filter($todo, fn ($plan) => ! $plan['variantsOnly']);
        if ($converting !== []) {
            $this->info(sprintf(
                '%d file(s) to convert: %s → %s (saves %s).',
                count($converting),
                $this->kb($bytesBefore),
                $this->kb($bytesAfter),
                $this->kb($bytesBefore - $bytesAfter),
            ));
        }
        if (count($todo) > count($converting)) {
            $this->info(sprintf('%d already-optimised file(s) get smaller srcset copies.', count($todo) - count($converting)));
        }

        if ($dryRun) {
            $this->warn('Dry run — no files written, database unchanged.');

            return self::SUCCESS;
        }

        if (! $this->confirm('Convert these images now? (back up the database and storage/app/public first)', true)) {
            return self::FAILURE;
        }

        // 1. Write the new files and their srcset copies (old files stay until the database no longer points at them).
        foreach ($todo as $plan) {
            if ($plan['main'] !== null) {
                $disk->put($plan['new'], $plan['main']);
            }
            foreach ($plan['variants'] as $width => $bytes) {
                $disk->put(ImageOptimizer::variantPath($plan['new'], $width), $bytes);
            }
        }

        // 2. Repoint every reference in one transaction; on failure remove the new files.
        try {
            DB::transaction(function () use ($references, $converting) {
                $dirty = [];
                foreach ($references as $ref) {
                    if (isset($converting[$ref['url']])) {
                        ($ref['set'])($converting[$ref['url']]['newUrl']);
                        $dirty[spl_object_id($ref['model'])] = $ref['model'];
                    }
                }
                foreach ($dirty as $model) {
                    $model->save(); // SiteSetting::saved clears its own cache
                }
            });
        } catch (\Throwable $e) {
            foreach ($converting as $plan) {
                $disk->delete([$plan['new'], ...ImageOptimizer::variantPaths($plan['new'])]);
            }
            $this->error('Database update failed — nothing was changed: '.$e->getMessage());

            return self::FAILURE;
        }

        SiteContent::clearCache();

        // 3. Remove the originals.
        if (! $this->option('keep-originals')) {
            foreach ($converting as $plan) {
                $disk->delete([$plan['old'], ...ImageOptimizer::variantPaths($plan['old'])]);
            }
        }

        $this->info(sprintf(
            'Done: %d image(s) converted, %d given srcset copies%s.',
            count($converting),
            count($todo) - count($converting),
            $converting === [] ? '' : ($this->option('keep-originals') ? ', originals kept' : ', originals deleted'),
        ));

        return self::SUCCESS;
    }

    /**
     * Every database field that can hold an uploaded image URL.
     *
     * @return list<array{label: string, url: string, format: string, maxSide: int, model: Model, set: \Closure}>
     */
    private function collectReferences(): array
    {
        $refs = [];
        $add = function (string $label, ?string $url, Model $model, \Closure $set, string $format = 'webp', int $maxSide = ImageOptimizer::MAX_SIDE) use (&$refs) {
            if (filled($url)) {
                $refs[] = compact('label', 'url', 'format', 'maxSide', 'model', 'set');
            }
        };

        foreach (SiteContent::where('type', 'image')->get() as $row) {
            foreach (['en_value', 'ar_value'] as $field) {
                $add("content {$row->key}", $row->{$field}, $row, fn ($url) => $row->{$field} = $url);
            }
        }

        foreach (Project::all() as $project) {
            $add("project #{$project->id}", $project->image_url, $project, fn ($url) => $project->image_url = $url);
        }

        foreach (Event::all() as $event) {
            $add("event {$event->slug}", $event->image_url, $event, fn ($url) => $event->image_url = $url);
            $add("event {$event->slug} trainer", $event->trainer_image_url, $event, fn ($url) => $event->trainer_image_url = $url);

            foreach ($event->testimonials ?? [] as $i => $testimonial) {
                $add(
                    "event {$event->slug} testimonial ".($i + 1),
                    $testimonial['avatar_url'] ?? null,
                    $event,
                    function ($url) use ($event, $i) {
                        $items = $event->testimonials;
                        $items[$i]['avatar_url'] = $url;
                        $event->testimonials = $items;
                    },
                );
            }
        }

        $settings = SiteSetting::first();
        if ($settings) {
            $add('site logo', $settings->logo_url, $settings, fn ($url) => $settings->logo_url = $url);
            $add('site logo (dark)', $settings->logo_dark_url, $settings, fn ($url) => $settings->logo_dark_url = $url);
            // iOS ignores WebP home-screen icons, so the site icon stays PNG — only resized.
            $add('site icon', $settings->favicon_url, $settings, fn ($url) => $settings->favicon_url = $url, 'png', ImageOptimizer::FAVICON_MAX_SIDE);
        }

        return $refs;
    }

    /** "…/storage/content/x.jpg" → "content/x.jpg", or null if the URL isn't one of our uploads. */
    private function relativePath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';
        $pos = strpos($path, '/storage/');
        if ($pos === false) {
            return null;
        }

        $relative = substr($path, $pos + strlen('/storage/'));
        $dir = strtok($relative, '/');

        if (str_contains($relative, '..') || ! in_array($dir, self::UPLOAD_DIRS, true)) {
            return null;
        }

        return $relative;
    }

    private function kb(int $bytes): string
    {
        return number_format($bytes / 1024).' KB';
    }
}
