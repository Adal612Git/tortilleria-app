<?php

namespace App\Jobs;

use App\Mail\WeeklyReportMail;
use App\Models\Product;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendWeeklyReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = now();
        $from = $now->copy()->startOfWeek();
        $to = $now->copy()->endOfWeek();

        // Productos base
        $products = Product::whereIn('name', ['Tortillas', 'Masa', 'Totopos'])->get()->keyBy('name');
        $ids = $products->pluck('id')->values();

        // Datos de la semana
        $ventas = Venta::whereBetween('created_at', [$from, $to])->get();

        // Series diarias (7 días)
        $labels = [];
        for ($i = 0; $i < 7; $i++) { $labels[] = $from->copy()->addDays($i)->format('Y-m-d'); }
        $series = [ 'Tortillas' => array_fill(0, 7, 0), 'Masa' => array_fill(0, 7, 0), 'Totopos' => array_fill(0, 7, 0) ];
        foreach ($ventas as $v) {
            $d = $v->created_at->copy()->startOfDay()->format('Y-m-d');
            $pos = array_search($d, $labels, true);
            if ($pos === false) continue;
            foreach (['Tortillas', 'Masa', 'Totopos'] as $name) {
                if (isset($products[$name]) && $v->product_id === $products[$name]->id) {
                    $series[$name][$pos] += (float) $v->total; break;
                }
            }
        }

        // Top 10 tiendas (usando campo cliente de pedidos/ventas si existe). Aquí agrupamos por cliente de Venta si existe; si no, omitido.
        $topTiendas = DB::table('pedidos')
            ->select('cliente', DB::raw('SUM(total) as total'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('cliente')
            ->orderByDesc(DB::raw('SUM(total)'))
            ->limit(10)->get();

        // Top repartidores (entregas entregadas)
        $topRepartidores = DB::table('entregas')
            ->join('pedidos', 'pedidos.id', '=', 'entregas.pedido_id')
            ->join('users', 'users.id', '=', 'entregas.motociclista_id')
            ->select('users.name as repartidor', DB::raw('COUNT(entregas.id) as entregas'), DB::raw('SUM(pedidos.total) as total'))
            ->where('entregas.status', 'entregado')
            ->whereBetween('entregas.created_at', [$from, $to])
            ->groupBy('entregas.motociclista_id')
            ->orderByDesc(DB::raw('SUM(pedidos.total)'))
            ->limit(10)->get();

        // Construir gráficos con QuickChart
        $base = 'https://quickchart.io/chart?c=';
        $chartVentas = $base . urlencode(json_encode([
            'type' => 'line',
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    ['label' => 'Tortillas', 'borderColor' => '#2563eb', 'fill' => false, 'data' => $series['Tortillas']],
                    ['label' => 'Masa', 'borderColor' => '#16a34a', 'fill' => false, 'data' => $series['Masa']],
                    ['label' => 'Totopos', 'borderColor' => '#f59e0b', 'fill' => false, 'data' => $series['Totopos']],
                ],
            ],
            'options' => ['plugins' => ['legend' => ['position' => 'bottom']]],
        ]));

        $chartTiendas = $base . urlencode(json_encode([
            'type' => 'bar',
            'data' => [
                'labels' => $topTiendas->pluck('cliente')->map(fn($v) => (string) $v)->toArray(),
                'datasets' => [[ 'label' => 'Ventas', 'backgroundColor' => '#9333ea', 'data' => $topTiendas->pluck('total')->map(fn($t) => (float) $t)->toArray() ]],
            ],
            'options' => ['indexAxis' => 'y'],
        ]));

        $chartRepartidores = $base . urlencode(json_encode([
            'type' => 'bar',
            'data' => [
                'labels' => $topRepartidores->pluck('repartidor')->toArray(),
                'datasets' => [[ 'label' => 'Ventas', 'backgroundColor' => '#ef4444', 'data' => $topRepartidores->pluck('total')->map(fn($t) => (float) $t)->toArray() ]],
            ],
            'options' => ['indexAxis' => 'y'],
        ]));

        // Resumen
        $totalSemana = (float) $ventas->sum('total');
        $topProducto = collect($series)->map(fn($arr, $name) => ['name' => $name, 'total' => array_sum($arr)])
            ->sortByDesc('total')->first();
        $topRep = $topRepartidores->sortByDesc('total')->first();
        $topTienda = $topTiendas->sortByDesc('total')->first();

        $charts = [
            'ventas' => $chartVentas,
            'tiendas' => $chartTiendas,
            'repartidores' => $chartRepartidores,
        ];
        $summary = [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'totalSemana' => $totalSemana,
            'topProducto' => $topProducto,
            'topRepartidor' => $topRep,
            'topTienda' => $topTienda,
        ];

        // Destinatarios: Admins
        $admins = User::with('role')->whereHas('role', fn($q) => $q->whereIn('name', ['Admin','Dueño']))->get();
        foreach ($admins as $admin) {
            Mail::to($admin->email)->send(new WeeklyReportMail($charts, $summary));
        }
    }
}

