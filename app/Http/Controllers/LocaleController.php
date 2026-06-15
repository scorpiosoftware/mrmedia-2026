<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function switch(Request $request, string $locale)
    {
        abort_unless(in_array($locale, ['en', 'ar']), 404);

        session(['locale' => $locale]);
        app()->setLocale($locale);

        return redirect()->back();
    }
}
