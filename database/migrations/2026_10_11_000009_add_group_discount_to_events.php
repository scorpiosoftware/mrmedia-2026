<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Percentage off the whole registration once it has at least `group_discount_min_attendees` people.
            $table->decimal('group_discount_percent', 5, 2)->nullable()->after('price');
            $table->unsignedSmallInteger('group_discount_min_attendees')->default(2)->after('group_discount_percent');
        });

        Schema::table('event_submissions', function (Blueprint $table) {
            // Price snapshot at registration time, so later price edits don't rewrite what a registrant was quoted.
            $table->decimal('unit_price', 10, 2)->nullable()->after('attendees');
            $table->decimal('discount_percent', 5, 2)->default(0)->after('unit_price');
            $table->decimal('total_price', 12, 2)->nullable()->after('discount_percent');
        });
    }

    public function down(): void
    {
        Schema::table('event_submissions', function (Blueprint $table) {
            $table->dropColumn(['unit_price', 'discount_percent', 'total_price']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['group_discount_percent', 'group_discount_min_attendees']);
        });
    }
};
