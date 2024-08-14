from django.contrib import admin

# Register your models here.
from .models import Benchmark
from .models import BenchmarkSize
from .models import BenchmarkColumns
admin.site.register(Benchmark)
admin.site.register(BenchmarkSize)
admin.site.register(BenchmarkColumns)