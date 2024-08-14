import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()
import json
#function to load data from log file to the benchmark database
#import model class
from benchmarks.models import Benchmark
from benchmarks.models import BenchmarkSize
from benchmarks.models import BenchmarkColumns
log = open(r"E:\prog\TNL\benchmarks\gp6\1_base_nvcc\tnl-benchmark-blas.log", mode="r")
for line in log.readlines():
    #create db table record object
    #objG=gpType()
    #objG.gp="gp6"
    #objG.gpType="1_base_nvcc"
    obj=Benchmark()
    #obj.gpType =objG
    objS=BenchmarkSize()
    objC = BenchmarkColumns()
    print(".")
    print("*")
    line = line.strip()
    data = json.loads(line)
    for key,value in data.items():
        if key == "operation":
            #print("op " + value)
            obj.operation=value
        elif key == "precision":
            #print("pre " + value)
            obj.precision=value
        elif key == "performer":
            #print("per "+ value)
            obj.performer=value
        elif key == "time":
            value=float(value)
            #print("tim ",value)
            obj.time=value
        elif key == "stddev":
            value=float(value)
            #print("stdev ",value)
            obj.stddev=value
        elif key =="stddev/time":
            value=float(value)
            #print("stdTim ",value)
            obj.stddev_time=value
        elif key =="loops":
            value=int(value)
            #print("loo ",value)
            obj.loops=value
        elif key =="bandwidth":
            value=float(value)
            #print("ban ",value)
            obj.bandwidth=value
        elif key =="speedup":
            if value=="N/A":
                obj.speedup=None
            else:
                value=float(value)
                obj.speedup=value
            #print("spee ",value)
        elif key == "host allocator":
            objS.host_allocator=value
        elif key=="size":
            if value !=None:
                value=int(value)
                objS.size=value
        elif key=="rows":
            if value !=None:
                value=int(value)
                objC.rows=value
        elif key=="columns":
            if value !=None:
                value=int(value)
                objC.columns=value
    obj.save()
    if "size" in line:
        objS.benchmark=obj
        objS.save()
    if "columns" in line:
        objC.benchmark=obj
        objC.save()



