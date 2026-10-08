<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /** GET /spa/admin/services — all services, ordered for display */
    public function index(): JsonResponse
    {
        return response()->json(
            Service::orderBy('sort_order')->orderByDesc('id')->get()
        );
    }

    /** POST /spa/admin/services */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateService($request);
        $data['sort_order'] = Service::max('sort_order') + 1;

        $service = Service::create($data);

        return response()->json($service);
    }

    /** POST /spa/admin/services/{service} */
    public function update(Request $request, Service $service): JsonResponse
    {
        $data = $this->validateService($request);

        $service->update($data);

        return response()->json($service);
    }

    /** DELETE /spa/admin/services/{service} */
    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    /** POST /spa/admin/services/reorder — body: { ids: [3, 1, 2, ...] } in the desired display order */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:services,id'],
        ]);

        foreach ($data['ids'] as $index => $id) {
            Service::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(
            Service::orderBy('sort_order')->orderByDesc('id')->get()
        );
    }

    private function validateService(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'description_ar' => ['nullable', 'string', 'max:2000'],
            'icon' => ['required', 'string', 'max:50'],
            'is_published' => ['boolean'],
        ]);
    }
}
