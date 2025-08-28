# 获取应用的日志目录
DEVICE_DIR=$(xcrun simctl get_app_container booted com.wty92911.paw-diary data)
LOG_DIR="$DEVICE_DIR/Library/Application Support/com.wty92911.paw-diary/logs"
# 打印日志目录
echo "日志目录: $LOG_DIR"

# 打印日志目录下的文件
ls -la "$LOG_DIR"

# 展示日志
less "$LOG_DIR/paw-diary.stdout.log"