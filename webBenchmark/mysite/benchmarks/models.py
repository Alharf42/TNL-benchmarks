from django.db import models

# Create your models here.

#class gpType(models.Model):
#    gp = models.CharField(max_length=5)
#    type = models.CharField(max_length=50)

class Benchmark(models.Model):
    #gpType = models.ForeignKey(gpType, on_delete=models.CASCADE)
    operation = models.CharField(max_length=50)
    precision = models.CharField(max_length=10)
    performer = models.CharField(max_length=50)
    time = models.FloatField()  
    stddev = models.FloatField()
    stddev_time = models.FloatField() 
    loops = models.IntegerField()
    bandwidth = models.FloatField()
    speedup = models.FloatField(null=True, blank=True) 
class BenchmarkSize(models.Model):
    benchmark=models.ForeignKey(Benchmark, on_delete=models.CASCADE)
    host_allocator = models.CharField(max_length=20, null=True,blank=True)
    size = models.IntegerField()  
class BenchmarkColumns(models.Model):
    benchmark=models.ForeignKey(Benchmark, on_delete=models.CASCADE)
    rows = models.IntegerField()
    columns = models.IntegerField()  

