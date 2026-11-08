<?php

namespace App\Support;

/**
 * Just enough user-agent parsing for visitor statistics: device class, browser, OS, and bots.
 */
class UserAgent
{
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|scrapy|semrush|ahrefs/i';

    public static function isBot(?string $ua): bool
    {
        return ! $ua || preg_match(self::BOT_PATTERN, $ua) === 1;
    }

    /** @return array{device: string, browser: string, os: string} */
    public static function parse(?string $ua): array
    {
        $ua = (string) $ua;

        return [
            'device'  => self::device($ua),
            'browser' => self::browser($ua),
            'os'      => self::os($ua),
        ];
    }

    private static function device(string $ua): string
    {
        if (preg_match('/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i', $ua)) {
            return 'tablet';
        }
        if (preg_match('/Mobi|iPhone|iPod|Android|Windows Phone|BlackBerry|Opera Mini/i', $ua)) {
            return 'mobile';
        }

        return 'desktop';
    }

    private static function browser(string $ua): string
    {
        // Order matters: most browsers also claim to be Chrome and/or Safari.
        return match (true) {
            (bool) preg_match('/FBAN|FBAV|FB_IAB|Instagram/i', $ua) => 'Facebook / Instagram app',
            (bool) preg_match('/Edg(e|A|iOS)?\//', $ua)               => 'Edge',
            (bool) preg_match('/OPR\/|Opera/', $ua)                   => 'Opera',
            (bool) preg_match('/SamsungBrowser/', $ua)                => 'Samsung Internet',
            (bool) preg_match('/Firefox|FxiOS/', $ua)                 => 'Firefox',
            (bool) preg_match('/Chrome|CriOS/', $ua)                  => 'Chrome',
            (bool) preg_match('/Safari/', $ua)                        => 'Safari',
            default                                                   => 'Other',
        };
    }

    private static function os(string $ua): string
    {
        return match (true) {
            (bool) preg_match('/iPhone|iPad|iPod/', $ua)   => 'iOS',
            (bool) preg_match('/Android/', $ua)            => 'Android',
            (bool) preg_match('/Windows/', $ua)            => 'Windows',
            (bool) preg_match('/Mac OS X|Macintosh/', $ua) => 'macOS',
            (bool) preg_match('/CrOS/', $ua)               => 'ChromeOS',
            (bool) preg_match('/Linux/', $ua)              => 'Linux',
            default                                        => 'Other',
        };
    }
}
