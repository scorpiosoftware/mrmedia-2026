<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\StoresUploadedImages;
use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    use StoresUploadedImages;

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
}
