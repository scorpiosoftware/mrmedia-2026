<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    use PasswordValidationRules;

    /** GET /spa/admin/profile — the logged-in admin's account info */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->only('id', 'name', 'email'));
    }

    /** POST /spa/admin/profile/password — change the logged-in admin's password */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => $this->currentPasswordRules(),
            'password'         => $this->passwordRules(),
        ]);

        $request->user()->update([
            'password' => $data['password'],
        ]);

        return response()->json(['message' => 'Password updated.']);
    }
}
