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

        // Productos base
        $products = Product::whereIn('name', ['Tortillas', 'Masa', 'Totopos'])->get()->keyBy('name');
        $ids = $products->pluck('id')->values();

        // Rango fechas: 30 días para diario y 12 semanas para semanal
        $desde30d = $now->copy()->subDays(29)->startOfDay();
        $desde12w = $now->copy()->subWeeks(11)->startOfWeek();

        $ventasRango = Venta::whereIn('product_id', $ids)
            ->where('created_at', '>=', min($desde30d, $desde12w))
            ->get(['product_id', 'total', 'created_at']);

        // Series por día por producto
        $labelsDia = [];
        $seriesDia = [
            'Tortillas' => array_fill(0, 30, 0),
            'Masa' => array_fill(0, 30, 0),
            'Totopos' => array_fill(0, 30, 0),
        ];
        for ($i = 0; $i < 30; $i++) {
            $day = $desde30d->copy()->addDays($i);
            $labelsDia[] = $day->format('Y-m-d');
        }
        foreach ($ventasRango as $v) {
            $d = $v->created_at->copy()->startOfDay()->format('Y-m-d');
            $pos = array_search($d, $labelsDia, true);
            if ($pos !== false) {
                foreach (['Tortillas', 'Masa', 'Totopos'] as $name) {
                    if (isset($products[$name]) && $v->product_id === $products[$name]->id) {
                        $seriesDia[$name][$pos] += (float) $v->total;
                        break;
                    }
                }
            }
        }

        // Serie concentrado total (diario)
        $dataTotalDia = [];
        for ($i = 0; $i < 30; $i++) {
            $sum = ($seriesDia['Tortillas'][$i] ?? 0) + ($seriesDia['Masa'][$i] ?? 0) + ($seriesDia['Totopos'][$i] ?? 0);
            $dataTotalDia[] = $sum;
        }

        // Series por semana por producto (últimas 12 semanas)
        $labelsSem = [];
        $seriesSem = [
            'Tortillas' => array_fill(0, 12, 0),
            'Masa' => array_fill(0, 12, 0),
            'Totopos' => array_fill(0, 12, 0),
        ];
        for ($i = 0; $i < 12; $i++) {
            $w = $desde12w->copy()->addWeeks($i);
            $labelsSem[] = $w->format('o-W'); // ISO year-week
        }
        foreach ($ventasRango as $v) {
            $wk = $v->created_at->copy()->startOfWeek()->format('o-W');
            $pos = array_search($wk, $labelsSem, true);
            if ($pos !== false) {
                foreach (['Tortillas', 'Masa', 'Totopos'] as $name) {
                    if (isset($products[$name]) && $v->product_id === $products[$name]->id) {
                        $seriesSem[$name][$pos] += (float) $v->total;
                        break;
                    }
                }
            }
        }

        // Top 10 productos (se mantiene)
        $ventasProducto = Venta::select('product_id', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(total) as total'))
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc(DB::raw('SUM(total)'))
            ->limit(10)
            ->get();
        $labelsProducto = $ventasProducto->map(fn($v) => $v->product->name);
        $dataProducto = $ventasProducto->map(fn($v) => (float) $v->total);

        // Top repartidores (por total de pedidos entregados)
        $topRepartidores = DB::table('entregas')
            ->join('pedidos', 'pedidos.id', '=', 'entregas.pedido_id')
            ->join('users', 'users.id', '=', 'entregas.motociclista_id')
            ->select('users.name as repartidor', DB::raw('COUNT(entregas.id) as entregas'), DB::raw('SUM(pedidos.total) as total'))
            ->where('entregas.status', 'entregado')
            ->groupBy('entregas.motociclista_id')
            ->orderByDesc(DB::raw('SUM(pedidos.total)'))
            ->limit(10)
            ->get();
        $labelsRepartidor = $topRepartidores->pluck('repartidor');
        $dataRepartidor = $topRepartidores->pluck('total')->map(fn($t) => (float) $t);

        // Cards
        $ventasHoy = Venta::whereDate('created_at', $now->toDateString())->sum('total');
        $ventasMes = Venta::whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->sum('total');
        $inventarioTotal = Inventory::sum('quantity');
        $pedidosActivos = Pedido::whereIn('status', ['pendiente', 'en_progreso'])->count();

        return view('dashboard.index', [
            'labelsDia' => $labelsDia,
            'seriesDia' => $seriesDia,
            'labelsSem' => $labelsSem,
            'seriesSem' => $seriesSem,
            'labelsProducto' => $labelsProducto,
            'dataProducto' => $dataProducto,
            'labelsTotalDia' => $labelsDia,
            'dataTotalDia' => $dataTotalDia,
            'labelsRepartidor' => $labelsRepartidor,
            'dataRepartidor' => $dataRepartidor,
            'ventasHoy' => $ventasHoy,
            'ventasMes' => $ventasMes,
            'inventarioTotal' => $inventarioTotal,
            'pedidosActivos' => $pedidosActivos,
            'topRepartidores' => $topRepartidores,
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
