@echo off
REM ListAcrossEU v2 - Blog System Management Script
REM This script helps manage the Django backend with blog and sidebar features

cd /d "C:\projects\listacrosseu_v2\backend"

:menu
echo.
echo ================================
echo  ListAcrossEU v2 - Blog System
echo ================================
echo 1. Start Django server (127.0.0.1:8000)
echo 2. Create superuser for Django admin
echo 3. Make migrations
echo 4. Apply migrations  
echo 5. Test blog API endpoints
echo 6. Open Django admin in browser
echo 7. Show database tables
echo 8. Reset database (WARNING: Deletes all data)
echo 9. Exit
echo.
set /p choice="Choose an option (1-9): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto create_superuser
if "%choice%"=="3" goto make_migrations
if "%choice%"=="4" goto apply_migrations
if "%choice%"=="5" goto test_api
if "%choice%"=="6" goto open_admin
if "%choice%"=="7" goto show_tables
if "%choice%"=="8" goto reset_database
if "%choice%"=="9" goto exit
echo Invalid choice. Please try again.
goto menu

:start_server
echo Starting Django development server...
python manage.py runserver 127.0.0.1:8000
goto menu

:create_superuser
echo Creating Django superuser...
python manage.py createsuperuser
goto menu

:make_migrations
echo Generating Django migrations...
python manage.py makemigrations
echo Migrations created successfully.
pause
goto menu

:apply_migrations
echo Applying Django migrations...
python manage.py migrate
echo Migrations applied successfully.
pause
goto menu

:test_api
echo Testing blog API endpoints...
echo.
echo Testing blog categories...
powershell -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:8000/api/blog/categories/'; Write-Host 'Categories API: OK - Status:' $r.StatusCode } catch { Write-Host 'Categories API: ERROR - Make sure server is running' }"
echo.
echo Testing blog posts...
powershell -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:8000/api/blog/posts/'; Write-Host 'Posts API: OK - Status:' $r.StatusCode } catch { Write-Host 'Posts API: ERROR - Make sure server is running' }"
echo.
echo Testing sidebar API...
powershell -Command "try { $r = Invoke-WebRequest 'http://127.0.0.1:8000/api/ui/sidebar/blog_sidebar/' -ErrorAction Stop; Write-Host 'Sidebar API: OK - Status:' $r.StatusCode } catch { if ($_.Exception.Response.StatusCode -eq 404) { Write-Host 'Sidebar API: OK - 404 expected (no slots created yet)' } else { Write-Host 'Sidebar API: ERROR -' $_.Exception.Message } }"
echo.
pause
goto menu

:open_admin
echo Opening Django admin in default browser...
start http://127.0.0.1:8000/admin/
echo Note: Server must be running (option 1) and you need a superuser account (option 2)
pause
goto menu

:show_tables
echo Showing database tables...
python manage.py dbshell < nul 2>nul
echo Available tables:
echo - blog_blogcategory
echo - blog_blogcategorytranslation  
echo - blog_blogpost
echo - blog_blogposttranslation
echo - ui_sidebarslot
echo - ui_sidebaritem
echo - hero_settings_heroeffectsettings
echo - hero_settings_uitextgroup
echo - hero_settings_uitexttranslation
echo - listings_business, listings_country, listings_city, listings_category
pause
goto menu

:reset_database
echo.
echo WARNING: This will delete ALL data in the database!
set /p confirm="Are you sure? Type 'yes' to confirm: "
if not "%confirm%"=="yes" (
    echo Reset cancelled.
    pause
    goto menu
)
echo Deleting database...
if exist db.sqlite3 del db.sqlite3
echo Creating new database...
python manage.py migrate
echo Database reset complete. You will need to create a new superuser.
pause
goto menu

:exit
echo Goodbye!
pause
exit