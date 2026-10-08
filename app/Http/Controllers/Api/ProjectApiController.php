<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectApiController extends Controller
{
    /** GET /api/projects?locale=en|ar — published projects for the public site, in display order */
    public function index(Request $request)
    {
        $locale = $request->get('locale') === 'ar' ? 'ar' : 'en';

        $projects = Project::where('is_published', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Project $project) => $this->present($project, $locale));

        return response()->json($projects);
    }

    private function present(Project $project, string $locale): array
    {
        return [
            'id' => $project->id,
            'slug' => $project->slug,
            'title' => $locale === 'ar' && $project->title_ar ? $project->title_ar : $project->title,
            'category' => $project->category,
            'client' => $locale === 'ar' && $project->client_ar ? $project->client_ar : $project->client,
            'description' => $locale === 'ar' && $project->description_ar ? $project->description_ar : $project->description,
            'external_url' => $project->external_url,
            'image_url' => $project->image_url,
            'color' => $project->color,
        ];
    }
}
