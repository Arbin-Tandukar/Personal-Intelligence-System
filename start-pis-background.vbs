' Personal Intelligence System - Silent Background Launcher
' Starts PIS without showing a command prompt window
Set WshShell = CreateObject("WScript.Shell")
strPath = WScript.ScriptFullName
strFolder = Left(strPath, InStrRev(strPath, "\"))
WshShell.CurrentDirectory = strFolder
WshShell.Run """" & strFolder & "venv\Scripts\python.exe"" run.py", 0, False
Set WshShell = Nothing
