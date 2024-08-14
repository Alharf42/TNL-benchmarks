from django.shortcuts import render
# Create your views here.
from .models import Benchmark
from .models import BenchmarkSize
from .models import BenchmarkColumns
from django.db.models import Case, When, IntegerField, Value
from django.core.serializers import serialize
import json

def base(request):
    #benchmark for specific log
    #allBData = Benchmark.objects.filter(gp="gp6", gpType="logType")
    allBData = Benchmark.objects.all()
    #dic to access benchmark data by key in size or column table 
    allBDataPk = {
        b.pk: {
            "precision": b.precision,
            "performer": b.performer,
            "time": b.time,
            "stddev": b.stddev,
            "stddev_time": b.stddev_time,
            "loops": b.loops,
            "bandwidth": b.bandwidth,
            "speedup": b.speedup,
            "operation": b.operation
        } 
        for b in allBData 
    }
    allSData = BenchmarkSize.objects.select_related("benchmark").all()
    #list of unique operations by their order in benchmark table
    operation_order = []
    for benchmark in allBData:
        if benchmark.operation not in operation_order:
            if benchmark.operation != "gemv":
                operation_order.append(benchmark.operation)
    #conditions to order size table by operations
    when_conditions = [
        When(benchmark__operation=operation, then=Value(index))
        for index, operation in enumerate(operation_order)
    ]
    #creates custom order and orders allSData by it(by operations-when conditions)
    allSData = BenchmarkSize.objects.select_related("benchmark").annotate(
        custom_order=Case(
            *when_conditions,
            output_field=IntegerField(),
        )
    ).order_by('custom_order')
    allCData = BenchmarkColumns.objects.all()
    #list of h_a per operations which is not eaqule to none
    host_allocator_perOp ={}
    for op in operation_order:
        record_perOp=allSData.filter(benchmark__operation=op)
        non_none_host_allocator = any(record.host_allocator for record in record_perOp)
        host_allocator_perOp[op]=non_none_host_allocator
    
    allBData=serialize("json",allBData)
    allSData=serialize("json",allSData)
    allCData=serialize("json",allCData)


    data = {
    "allBData": json.loads(allBData),
    "allSData": json.loads(allSData),
    "allCData": json.loads(allCData),
    "operation_order": operation_order,
    "host_allocator_perOp": host_allocator_perOp,
    "allBDataPk": allBDataPk,
    }
    return render(request,"benchmarks/base.html",{"data": json.dumps(data)})

    #return render(request, "benchmarks/base.html",context)