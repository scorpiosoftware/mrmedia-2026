<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

/**
 * Placeholder portfolio work so the Portfolio section renders on a fresh install.
 * These are not real client projects — replace them through the admin panel
 * rather than running this seeder on production.
 */
class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            ['title' => 'TechVentures Rebrand',  'slug' => 'techventures-rebrand',  'category' => 'brand',   'color' => '#213C93'],
            ['title' => 'Gulf Retail Campaign',  'slug' => 'gulf-retail-campaign',  'category' => 'digital', 'color' => '#DDB50E'],
            ['title' => 'BrandLab Documentary',  'slug' => 'brandlab-documentary',  'category' => 'media',   'color' => '#192E74'],
            ['title' => 'FinanceHub Identity',   'slug' => 'financehub-identity',   'category' => 'brand',   'color' => '#2E52C9'],
            ['title' => 'E-Commerce Growth',     'slug' => 'e-commerce-growth',     'category' => 'digital', 'color' => '#FCD532'],
            ['title' => 'Product Launch Video',  'slug' => 'product-launch-video',  'category' => 'media',   'color' => '#213C93'],
        ];

        foreach ($projects as $index => $project) {
            Project::firstOrCreate(
                ['slug' => $project['slug']],
                $project + ['sort_order' => $index + 1, 'is_published' => true],
            );
        }
    }
}
