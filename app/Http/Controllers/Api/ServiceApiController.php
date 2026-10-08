<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceApiController extends Controller
{
    /** GET /api/services?locale=en|ar — published services for the public site, in display order */
    public function index(Request $request)
    {
        $locale = $request->get('locale') === 'ar' ? 'ar' : 'en';

        $services = Service::where('is_published', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Service $service) => $this->present($service, $locale));

        return response()->json($services);
    }

    private function present(Service $service, string $locale): array
    {
        return [
            'id' => $service->id,
            'title' => $locale === 'ar' && $service->title_ar ? $service->title_ar : $service->title,
            'description' => $locale === 'ar' && $service->description_ar ? $service->description_ar : $service->description,
            'icon' => $service->icon,
        ];
    }
}
