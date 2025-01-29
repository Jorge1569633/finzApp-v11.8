Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%") & "\Desktop\FinzApp.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "http://localhost:3000"
oLink.IconLocation = WScript.CreateObject("WScript.Shell").CurrentDirectory & "\La App que tus finanzas necesitan.png"
oLink.Description = "FinzApp - Sistema de Finanzas Personales"
oLink.Save