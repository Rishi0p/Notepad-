Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the folder this script lives in
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(scriptDir, "start-noteforge.bat")

If Not fso.FileExists(batPath) Then
  MsgBox "Cannot find start-noteforge.bat in:" & vbCrLf & scriptDir, vbCritical, "NoteForge"
  WScript.Quit 1
End If

' Create shortcut on Desktop
desktopPath = WshShell.SpecialFolders("Desktop")
lnkPath = fso.BuildPath(desktopPath, "NoteForge.lnk")

Set shortcut = WshShell.CreateShortcut(lnkPath)
shortcut.TargetPath = batPath
shortcut.WorkingDirectory = scriptDir
shortcut.Description = "Launch NoteForge"
shortcut.WindowStyle = 1
shortcut.Save

MsgBox "Shortcut created on your Desktop!" & vbCrLf & vbCrLf & "Double-click 'NoteForge' to launch.", vbInformation, "NoteForge"
