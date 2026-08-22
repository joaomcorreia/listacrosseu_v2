1. Backend, port 8020

Open PowerShell:

cd C:\projects\listacrosseu_v2\backend
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8020

Leave that window running.

You should then get:

http://127.0.0.1:8020/admin/

2. Frontend, port 3004
Open a second PowerShell:

cd C:\projects\listacrosseu_v2\frontend
npm run dev -- -p 3004

Leave that one running too.

Then open:

http://127.0.0.1:3004/en