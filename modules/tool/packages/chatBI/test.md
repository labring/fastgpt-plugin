curl -X POST 'http://localhost:3030/tool/runstream' \
  -H 'Content-Type: application/json' \
  -H 'authtoken: your_auth_token' \
  --data-raw '{
    "toolId": "chatBI",
    "inputs": {
      "query": "2025年7月三部下面各个业务员的计划完成率是多少？",
      "appId": "120",
      "appAccessKey": "bafb07ab84da471391d8be4a97a4b4ef",
      "userID": "employee001",
      "sessionId": "chat_session_20241201_002",
      "chatBiUrl": "http://192.168.59.23:31630",
      "sysAccessKey": "d6c431c92f0c465986a002a6e81717af",
      "corpId": "dingaa699e168492c776f2c783f7214b6d69"
    },
    "systemVar": {
      "user": {
        "username": "employee001",
        "contact": "employee001@example.com"
      }
    }
  }'