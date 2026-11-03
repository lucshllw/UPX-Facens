$ErrorActionPreference = 'Stop'
$reuseRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $reuseRoot
$reuseJdk = Get-ChildItem -LiteralPath "$reuseRoot/.reuse-tools/jdk" -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path -LiteralPath "$($_.FullName)/bin/javac.exe" } | Select-Object -First 1
if ($reuseJdk) { $env:JAVA_HOME = $reuseJdk.FullName }
$reuseMaven = "$reuseRoot/.reuse-tools/apache-maven-3.9.9/bin/mvn.cmd"
if (!(Test-Path -LiteralPath $reuseMaven)) { $reuseMaven = 'mvn' }
node tools/sync-static.js
& $reuseMaven '-Pdev' 'package' '-DskipTests' '-Dmaven.repo.local=.reuse-tools/repository'
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível preparar o servidor Java.' }
$reuseJava = if ($reuseJdk) { "$($reuseJdk.FullName)/bin/java.exe" } else { 'java' }
& $reuseJava '-jar' 'target/reuse-plus-0.0.1-SNAPSHOT.jar' '--spring.profiles.active=dev' '--server.address=127.0.0.1' '--spring.web.resources.static-locations=file:src/main/resources/static/,classpath:/static/'
