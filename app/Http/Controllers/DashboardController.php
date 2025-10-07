<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Pedido;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $now = now();

        $fromInput = $request->query('from');
        $toInput = $request->query('to');

        try {
            $rangeFrom = $fromInput ? Carbon::parse($fromInput)->startOfDay() : null;
        } catch (\Throwable $e) {
            $rangeFrom = null;
        }

        try {
            $rangeTo = $toInput ? Carbon::parse($toInput)->endOfDay() : null;
        } catch (\Throwable $e) {
            $rangeTo = null;
        }

        $rangeFrom ??= $now->copy()->subDays(29)->startOfDay();
        $rangeTo ??= $now->copy()->endOfDay();
        if ($rangeFrom->gt($rangeTo)) {
            [$rangeFrom, $rangeTo] = [$rangeTo->copy()->startOfDay(), $rangeFrom->copy()->endOfDay()];
        }

        $ventasFiltradas = Venta::with('product')
            ->when($rangeFrom, fn($q) => $q->where('created_at', '>=', $rangeFrom))
            ->when($rangeTo, fn($q) => $q->where('created_at', '<=', $rangeTo))
            ->get();

        $ventaTotalRango = (float) $ventasFiltradas->sum('total');
        $ventasPorProducto = $ventasFiltradas->groupBy(fn($venta) => optional($venta->product)->name ?? 'Desconocido');
        $totalCostales = (float) $ventasPorProducto->get('Maiz', collect())->sum('quantity');
        $totalMasa = (float) $ventasPorProducto->get('Masa', collect())->sum('quantity');
        $totalTortillas = (float) $ventasPorProducto->get('Tortillas', collect())->sum('quantity');

        $period = new \DatePeriod($rangeFrom, new \DateInterval('P1D'), $rangeTo->copy()->addDay());
        $labelsVentaRango = [];
        $dataVentaRango = [];
        foreach ($period as $day) {
            $labelsVentaRango[] = $day->format('Y-m-d');
            $dataVentaRango[] = (float) $ventasFiltradas->whereBetween('created_at', [
                Carbon::parse($day)->startOfDay(),
                Carbon::parse($day)->endOfDay(),
            ])->sum('total');
        }

        $topProductos = $ventasFiltradas->groupBy('product_id')
            ->map(function ($ventas) {
                $producto = optional($ventas->first()->product)->name ?? 'Desconocido';
                return [
                    'name' => $producto,
                    'total' => $ventas->sum('total'),
                ];
            })
            ->sortByDesc('total')
            ->take(10)
            ->values();
        $labelsProducto = $topProductos->pluck('name');
        $dataProducto = $topProductos->pluck('total')->map(fn($v) => (float) $v);

        $topTiendas = Pedido::select('cliente', DB::raw('SUM(total) as total'))
            ->when($rangeFrom, fn($q) => $q->where('created_at', '>=', $rangeFrom))
            ->when($rangeTo, fn($q) => $q->where('created_at', '<=', $rangeTo))
            ->groupBy('cliente')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
        $labelsTiendas = $topTiendas->pluck('cliente');
        $dataTiendas = $topTiendas->pluck('total')->map(fn($v) => (float) $v);

        $ventasHoy = Venta::whereDate('created_at', $now->toDateString())->sum('total');
        $ventasMes = Venta::whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->sum('total');
        $inventarioTotal = Inventory::sum('quantity');
        $pedidosActivos = Pedido::whereIn('status', ['pendiente', 'en_progreso'])->count();
        $pedidosActivosList = Pedido::whereIn('status', ['pendiente', 'en_progreso'])
            ->orderBy('created_at')
            ->limit(10)
            ->get();

        return view('dashboard.index', [
            'ventasHoy' => $ventasHoy,
            'ventasMes' => $ventasMes,
            'inventarioTotal' => $inventarioTotal,
            'pedidosActivos' => $pedidosActivos,
            'ventaTotalRango' => $ventaTotalRango,
            'totalCostales' => $totalCostales,
            'totalMasa' => $totalMasa,
            'totalTortillas' => $totalTortillas,
            'totalDineroRango' => $ventaTotalRango,
            'labelsVentaRango' => $labelsVentaRango,
            'dataVentaRango' => $dataVentaRango,
            'labelsProducto' => $labelsProducto,
            'dataProducto' => $dataProducto,
            'labelsTiendas' => $labelsTiendas,
            'dataTiendas' => $dataTiendas,
            'pedidosActivosList' => $pedidosActivosList,
            'rangeFrom' => $rangeFrom,
            'rangeTo' => $rangeTo,
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
