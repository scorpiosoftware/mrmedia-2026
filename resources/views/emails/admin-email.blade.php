<!DOCTYPE html>
@php($siteName = \App\Models\SiteSetting::current()->site_name)
@php($rtl = (bool) preg_match('/\p{Arabic}/u', $bodyText))
<html lang="{{ $rtl ? 'ar' : 'en' }}" dir="{{ $rtl ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $email->subject }}</title>
</head>
<body style="margin:0; padding:24px; background:#F1F1F0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #E3E6F0;">
        <div style="height:6px; background:#213C93;"></div>
        <div style="padding:32px; font-size:15px; line-height:1.7; color:#0D1B4B; text-align:{{ $rtl ? 'right' : 'left' }};">
            {!! nl2br(e($bodyText)) !!}

            @if ($signature)
                <div style="margin-top:28px; padding-top:16px; border-top:1px solid #E8EAF6; font-size:14px; color:#5A6A9A;">
                    {!! nl2br(e($signature)) !!}
                </div>
            @endif

            @if ($quoted)
                <div style="margin-top:28px; padding:16px 18px; background:#F7F8FB; border-{{ $rtl ? 'right' : 'left' }}:3px solid #D1D5E8; border-radius:8px; font-size:13px; color:#5A6A9A;" dir="auto">
                    <div style="margin-bottom:8px; font-weight:600;">
                        {{ $quoted->name }} wrote on {{ $quoted->created_at->format('M j, Y \a\t g:i A') }}:
                    </div>
                    {!! nl2br(e($quoted->message)) !!}
                </div>
            @endif
        </div>
        <div style="background:#F7F8FB; padding:14px 32px; text-align:center; font-size:12px; color:#898781;">
            {{ $siteName }}
        </div>
    </div>
</body>
</html>
