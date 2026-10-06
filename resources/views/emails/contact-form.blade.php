<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Message</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F1F1F0; margin: 0; padding: 24px; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(33,60,147,0.10); }
        .header { background: #213C93; padding: 28px 32px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #5A6A9A; margin-bottom: 6px; }
        .field p { margin: 0; font-size: 15px; color: #0D1B4B; line-height: 1.6; }
        .divider { border: none; border-top: 1px solid #E8EAF6; margin: 24px 0; }
        .footer { background: #F1F1F0; padding: 16px 32px; text-align: center; font-size: 12px; color: #5A6A9A; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>New Contact Form Message</h1>
            <p>Mr.MEDIA Portfolio · {{ now()->format('M j, Y \a\t g:i A') }}</p>
        </div>
        <div class="body">
            <div class="field">
                <label>Name</label>
                <p>{{ $senderName }}</p>
            </div>
            <div class="field">
                <label>Email</label>
                <p>{{ $senderEmail }}</p>
            </div>
            <div class="field">
                <label>Service Interested In</label>
                <p>{{ $service }}</p>
            </div>
            <hr class="divider">
            <div class="field">
                <label>Message</label>
                <p>{{ $body }}</p>
            </div>
        </div>
        <div class="footer">
            Sent via the contact form on Mr.MEDIA portfolio
        </div>
    </div>
</body>
</html>
