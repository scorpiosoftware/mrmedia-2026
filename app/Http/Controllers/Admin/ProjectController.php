<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /** Only these real (content-sniffed) MIME types may ever be stored, mapped to the extension we persist with. */
    private const ALLOWED_IMAGE_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private const UPLOAD_DIR = 'projects';

    /** GET /spa/admin/projects — all projects, ordered for display */
    public function index(): JsonResponse
    {
        return response()->json(
            Project::orderBy('sort_order')->orderByDesc('id')->get()
        );
    }

    /** POST /spa/admin/projects */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateProject($request);
        $data['slug'] = $this->generateUniqueSlug($data['title']);
        $data['sort_order'] = Project::max('sort_order') + 1;

        $project = Project::create($data);

        return response()->json($project);
    }

    /** POST /spa/admin/projects/{project} */
    public function update(Request $request, Project $project): JsonResponse
    {
        $data = $this->validateProject($request);

        $project->update($data);

        return response()->json($project);
    }

    /** DELETE /spa/admin/projects/{project} */
    public function destroy(Project $project): JsonResponse
    {
        $this->forgetStoredImage($project->image_url);

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    /** POST /spa/admin/projects/reorder — body: { ids: [3, 1, 2, ...] } in the desired display order */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:projects,id'],
        ]);

        foreach ($data['ids'] as $index => $id) {
            Project::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(
            Project::orderBy('sort_order')->orderByDesc('id')->get()
        );
    }

    /**
     * POST /spa/admin/projects/upload-image
     *
     * Hardened image upload:
     *  - Client-supplied filename/extension is never trusted or used.
     *  - Real file content is sniffed (getimagesize) against a strict MIME allow-list;
     *    the stored extension is derived from that, not from the original filename,
     *    which by itself defeats double-extension / renamed-executable tricks.
     *  - The image is fully re-encoded through GD, discarding every byte that isn't
     *    actual pixel data — this neutralises polyglot files (a valid image with a
     *    payload appended/hidden after the real image data).
     *  - Dimensions and file size are capped to avoid decompression-bomb style abuse.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2000', // ~2MB — stays under this server's upload_max_filesize (2M) so oversized files fail validation cleanly
                'dimensions:max_width=6000,max_height=6000',
            ],
        ]);

        $file = $request->file('image');

        $info = @getimagesize($file->getRealPath());
        if ($info === false) {
            return response()->json(['message' => 'The uploaded file is not a valid image.'], 422);
        }

        $mime = $info['mime'] ?? null;
        if (! isset(self::ALLOWED_IMAGE_MIMES[$mime])) {
            return response()->json(['message' => 'Unsupported image type.'], 422);
        }

        $reencoded = $this->reencode($file->getRealPath(), $mime);
        if ($reencoded === null) {
            return response()->json(['message' => 'Failed to process the uploaded image.'], 422);
        }

        $filename = Str::uuid()->toString().'.'.self::ALLOWED_IMAGE_MIMES[$mime];
        $path = self::UPLOAD_DIR.'/'.$filename;

        Storage::disk('public')->put($path, $reencoded);

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }

    private function validateProject(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'client' => ['nullable', 'string', 'max:255'],
            'client_ar' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'description_ar' => ['nullable', 'string', 'max:5000'],
            'external_url' => ['nullable', 'string', 'max:2048'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_published' => ['boolean'],
        ]);
    }

    /** Generates a URL-safe slug from the title, appending -2, -3, … on collision. */
    private function generateUniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'project';
        $slug = $base;
        $i = 2;

        while (Project::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    /** Re-encodes the image via GD, stripping anything that isn't genuine pixel data. */
    private function reencode(string $path, string $mime): ?string
    {
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if (! $image instanceof \GdImage) {
            return null;
        }

        ob_start();

        match ($mime) {
            'image/jpeg' => imagejpeg($image, null, 87),
            'image/png' => (function () use ($image) {
                imagesavealpha($image, true);
                imagepng($image, null, 6);
            })(),
            'image/webp' => imagewebp($image, null, 85),
        };

        $data = ob_get_clean();
        imagedestroy($image);

        return $data ?: null;
    }

    /** Deletes a previously uploaded image from local storage, if the URL points at one. */
    private function forgetStoredImage(?string $url): void
    {
        if (! $url) {
            return;
        }

        $marker = '/storage/'.self::UPLOAD_DIR.'/';
        if (! str_contains($url, $marker)) {
            return;
        }

        $path = self::UPLOAD_DIR.'/'.basename($url);
        Storage::disk('public')->delete($path);
    }
}
