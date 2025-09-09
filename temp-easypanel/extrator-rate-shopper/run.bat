@ECHO off

ECHO Configure corretamente o arquivo de configuracao desse programa antes de executa-lo para obter o resultado desejado.
ECHO.
ECHO Esse arquivo pode ser encontrado em: %~dp0src\config.json
ECHO E o conteudo atual dele e o seguinte:
ECHO.
TYPE "%~dp0src\config.json"
ECHO.
ECHO Caso ainda nao o tenha configurado, feche essa janela e configure-o. 
ECHO.
pause
ECHO.
ECHO O programa sera iniciado agora...
ECHO.

node src/index.js

pause
