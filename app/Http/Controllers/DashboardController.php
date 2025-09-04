<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Pedido;
use App\Models\Product;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $now = now();

        // Ventas por hora (últimas 24h)
        $desde24 = $now->copy()->subHours(24);
        $ventasHoraRaw = Venta::select(
                DB::raw("strftime('%Y-%m-%d %H:00:00', created_at) as h"),
                DB::raw('SUM(total) as total')
            )
            ->where('created_at', '>=', $desde24)
            ->groupBy('h')
            ->orderBy('h')
            ->get();
        $labelsHora = [];
        $dataHora = [];
        for ($i = 23; $i >= 0; $i--) {
            $slot = $now->copy()->subHours($i)->startOfHour();
            $labelsHora[] = $slot->format('H:00');
            $match = $ventasHoraRaw->firstWhere('h', $slot->format('Y-m-d H:00:00'));
            $dataHora[] = $match->total ?? 0;
        }

        // Ventas por día (últimos 30 días)
        $desde30d = $now->copy()->subDays(29)->startOfDay();
        $ventasDiaRaw = Venta::select(
                DB::raw("date(created_at) as d"),
                DB::raw('SUM(total) as total')
            )
            ->where('created_at', '>=', $desde30d)
            ->groupBy('d')
            ->orderBy('d')
            ->get();
        $labelsDia = [];
        $dataDia = [];
        for ($i = 0; $i < 30; $i++) {
            $day = $desde30d->copy()->addDays($i);
            $labelsDia[] = $day->format('Y-m-d');
            $match = $ventasDiaRaw->firstWhere('d', $day->format('Y-m-d'));
            $dataDia[] = $match->total ?? 0;
        }

        // Ventas por producto (top 10)
        $ventasProducto = Venta::select('product_id', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(total) as total'))
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc(DB::raw('SUM(total)'))
            ->limit(10)
            ->get();
        $labelsProducto = $ventasProducto->map(fn($v) => $v->product->name);
        $dataProducto = $ventasProducto->map(fn($v) => $v->total);

        // Cards
        $ventasHoy = Venta::whereDate('created_at', $now->toDateString())->sum('total');
        $ventasMes = Venta::whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->sum('total');
        $inventarioTotal = Inventory::sum('quantity');
        $pedidosActivos = Pedido::whereIn('status', ['pendiente', 'en_progreso'])->count();

        return view('dashboard.index', [
            'labelsHora' => $labelsHora,
            'dataHora' => $dataHora,
            'labelsDia' => $labelsDia,
            'dataDia' => $dataDia,
            'labelsProducto' => $labelsProducto,
            'dataProducto' => $dataProducto,
            'ventasHoy' => $ventasHoy,
            'ventasMes' => $ventasMes,
            'inventarioTotal' => $inventarioTotal,
            'pedidosActivos' => $pedidosActivos,
        ]);
    }

    public function exportVentasPDF(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $ventas = Venta::with('product', 'user')
            ->when($from, fn($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to))
            ->orderBy('created_at')->get();
        $total = $ventas->sum('total');
        $pdf = Pdf::loadView('reportes.ventas_pdf', compact('ventas', 'from', 'to', 'total'));
        return $pdf->download('ventas.pdf');
    }

    public function exportVentasCSV(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $ventas = Venta::with('product', 'user')
            ->when($from, fn($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to))
            ->orderBy('created_at')->get();

        $filename = 'ventas.csv';
        return response()->streamDownload(function () use ($ventas) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Fecha', 'Producto', 'Cantidad', 'Total', 'Usuario']);
            foreach ($ventas as $v) {
                fputcsv($out, [
                    $v->created_at->format('Y-m-d H:i'),
                    $v->product->name,
                    $v->quantity,
                    number_format($v->total, 2, '.', ''),
                    $v->user->name,
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Cache-Control' => 'no-store',
        ]);
    }

    public function exportInventarioPDF()
    {
        $inventario = Inventory::with('product')->orderByRaw('LOWER((select name from products where products.id = inventories.product_id))')->get();
        $pdf = Pdf::loadView('reportes.inventario_pdf', compact('inventario'));
        return $pdf->download('inventario.pdf');
    }

    public function exportInventarioCSV()
    {
        $inventario = Inventory::with('product')->get();
        $filename = 'inventario.csv';
        return response()->streamDownload(function () use ($inventario) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Producto', 'Cantidad', 'Stock mínimo']);
            foreach ($inventario as $i) {
                fputcsv($out, [
                    $i->product->name,
                    $i->quantity,
                    $i->min_stock,
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Cache-Control' => 'no-store',
        ]);
    }

    private function dateRange(Request $request): array
    {
        $from = $request->query('from');
        $to = $request->query('to');
        return [$from ?: null, $to ?: null];
    }
}

