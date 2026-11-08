{!! $bodyText !!}
@if ($signature)

--
{!! $signature !!}
@endif
@if ($quoted)

On {{ $quoted->created_at->format('M j, Y \a\t g:i A') }}, {!! $quoted->name !!} wrote:
{!! collect(preg_split('/\R/', (string) $quoted->message))->map(fn ($line) => '> '.$line)->implode("\n") !!}
@endif
