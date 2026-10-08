<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    /** GET /spa/admin/inbox?filter=all|unread|spam — paginated contact messages, newest first */
    public function index(Request $request): JsonResponse
    {
        $filter = in_array($request->get('filter'), ['all', 'unread', 'spam'], true)
            ? $request->get('filter')
            : 'all';

        $query = ContactMessage::query()->latest();

        match ($filter) {
            'unread' => $query->genuine()->where('is_read', false),
            'spam' => $query->where('is_spam', true),
            default => $query->genuine(),
        };

        $messages = $query->paginate(20)->withQueryString();

        return response()->json([
            'messages' => $messages,
            'counts' => $this->counts(),
        ]);
    }

    /** POST /spa/admin/inbox/{contactMessage}/read — body: { is_read: bool } */
    public function markRead(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $data = $request->validate(['is_read' => ['required', 'boolean']]);

        $contactMessage->update([
            'is_read' => $data['is_read'],
            'read_at' => $data['is_read'] ? now() : null,
        ]);

        return response()->json([
            'message' => $contactMessage->fresh(),
            'counts' => $this->counts(),
        ]);
    }

    /** DELETE /spa/admin/inbox/{contactMessage} */
    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->delete();

        return response()->json([
            'message' => 'Message deleted.',
            'counts' => $this->counts(),
        ]);
    }

    private function counts(): array
    {
        return [
            'all' => ContactMessage::genuine()->count(),
            'unread' => ContactMessage::genuine()->where('is_read', false)->count(),
            'spam' => ContactMessage::where('is_spam', true)->count(),
        ];
    }
}
