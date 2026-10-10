<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // About the Event — target audience
            $table->text('target_audience')->nullable()->after('description_ar');
            $table->text('target_audience_ar')->nullable()->after('target_audience');

            // Learning Outcomes / Agenda — array of {title, title_ar, description, description_ar}
            $table->json('agenda')->nullable()->after('target_audience_ar');

            // Trainer / Speaker
            $table->string('trainer_name')->nullable()->after('agenda');
            $table->string('trainer_name_ar')->nullable()->after('trainer_name');
            $table->string('trainer_title')->nullable()->after('trainer_name_ar');
            $table->string('trainer_title_ar')->nullable()->after('trainer_title');
            $table->text('trainer_bio')->nullable()->after('trainer_title_ar');
            $table->text('trainer_bio_ar')->nullable()->after('trainer_bio');
            $table->string('trainer_image_url')->nullable()->after('trainer_bio_ar');
            // array of {text, text_ar}
            $table->json('trainer_credentials')->nullable()->after('trainer_image_url');

            // Registration — payment note shown alongside the form
            $table->text('payment_note')->nullable()->after('trainer_credentials');
            $table->text('payment_note_ar')->nullable()->after('payment_note');

            // Testimonials — array of {quote, quote_ar, name, role, role_ar, avatar_url}
            $table->json('testimonials')->nullable()->after('payment_note_ar');

            // FAQ — array of {question, question_ar, answer, answer_ar}
            $table->json('faqs')->nullable()->after('testimonials');

            // Final CTA
            $table->string('cta_heading')->nullable()->after('faqs');
            $table->string('cta_heading_ar')->nullable()->after('cta_heading');
            $table->text('cta_subheading')->nullable()->after('cta_heading_ar');
            $table->text('cta_subheading_ar')->nullable()->after('cta_subheading');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'target_audience', 'target_audience_ar',
                'agenda',
                'trainer_name', 'trainer_name_ar',
                'trainer_title', 'trainer_title_ar',
                'trainer_bio', 'trainer_bio_ar',
                'trainer_image_url', 'trainer_credentials',
                'payment_note', 'payment_note_ar',
                'testimonials',
                'faqs',
                'cta_heading', 'cta_heading_ar',
                'cta_subheading', 'cta_subheading_ar',
            ]);
        });
    }
};
