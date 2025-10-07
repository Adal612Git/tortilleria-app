<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WeeklyReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $charts;
    public array $summary;

    public function __construct(array $charts, array $summary)
    {
        $this->charts = $charts;
        $this->summary = $summary;
    }

    public function build()
    {
        return $this->subject('Reporte semanal - Tortillería')
            ->view('emails.weekly_report');
    }
}

