import sys
import os

print("=== Python环境检查 ===")
print(f"Python版本: {sys.version}")
print(f"Python解释器路径: {sys.executable}")
print(f"操作系统: {os.name}")
print(f"当前工作目录: {os.getcwd()}")
print(f"Python路径列表: {sys.path}")
print("=== 环境变量检查 ===")
print(f"PATH环境变量: {os.environ.get('PATH', '未找到')}")
print("=== 检查完成 ===")