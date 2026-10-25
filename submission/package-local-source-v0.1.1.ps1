$ErrorActionPreference = 'Stop'
$qlooEventRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$qlooProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $qlooEventRoot 'project'))
$qlooFrozenSource = @(Get-Content -LiteralPath (Join-Path $qlooEventRoot 'evidence\source-manifest-v0.1.1.json') -Raw | ConvertFrom-Json)
$qlooArchivePath = Join-Path $PSScriptRoot 'common-ground-v0.1.1-prekey.zip'
$qlooConfig = Get-Content -LiteralPath (Join-Path $qlooProjectRoot 'wrangler.jsonc') -Raw | ConvertFrom-Json
foreach ($qlooFlag in @('QLOO_LIVE_ENABLED','QLOO_CONTRACT_VERIFIED','QLOO_BUDGET_VERIFIED')) {
  if ($qlooConfig.vars.$qlooFlag -cne 'false') { throw "Release blocked: $qlooFlag must be false." }
}
foreach ($qlooLimit in @('QLOO_MINUTE_LIMIT','QLOO_DAILY_LIMIT','QLOO_EVENT_LIMIT')) {
  if ($qlooConfig.vars.$qlooLimit -cne '0') { throw "Release blocked: $qlooLimit must be 0." }
}
if ($qlooFrozenSource.Count -ne 20) { throw 'Source inventory changed: review and update the pre-key package recipe.' }
$qlooInputs = [System.Collections.Generic.List[object]]::new()
foreach ($qlooSource in $qlooFrozenSource) {
  if ($qlooSource.path -match '(^|/)(\.env[^/]*|\.dev\.vars[^/]*|private-results|node_modules|\.wrangler)(/|$)' -or $qlooSource.path -match '(^|/)\.\.(/|$)') { throw 'Private or unsafe source path.' }
  $qlooFullPath = [System.IO.Path]::GetFullPath((Join-Path $qlooProjectRoot $qlooSource.path))
  if (-not $qlooFullPath.StartsWith($qlooProjectRoot + [System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)) { throw 'Source escaped project root.' }
  $qlooActualHash = (Get-FileHash -LiteralPath $qlooFullPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($qlooActualHash -cne $qlooSource.sha256) { throw "Frozen source changed: $($qlooSource.path)" }
  $qlooInputs.Add([PSCustomObject]@{entry='project/'+$qlooSource.path;path=$qlooFullPath})
}
foreach ($qlooDoc in @('DEPLOYMENT-AND-JUDGE-ACCESS.md','LIVE-ACCEPTANCE-PLAN.md','ENTRY-DRAFT.md','LOCAL-DEMO.md','package-local-source-v0.1.1.ps1','RELEASE-CHECKLIST.md')) {
  $qlooInputs.Add([PSCustomObject]@{entry='submission/'+$qlooDoc;path=(Join-Path $PSScriptRoot $qlooDoc)})
}
foreach ($qlooEvidence in @('source-manifest-v0.1.1.json','local-tests-v0.1.1.tap')) {
  $qlooInputs.Add([PSCustomObject]@{entry='evidence/'+$qlooEvidence;path=(Join-Path $qlooEventRoot ('evidence\'+$qlooEvidence))})
}
$qlooInputs.Add([PSCustomObject]@{entry='LICENSE';path=(Join-Path $qlooProjectRoot 'LICENSE')})
$qlooReadme = @'
# Common Ground 0.1.1 — local pre-key source package

Synthetic engineering prototype for the Qloo Agentic Hackathon. No authenticated Qloo integration, public deployment or qualifying submission is claimed. API request submitted per the human; approval/key pending. Supplemental Pro critique is unreadable; the coordinator timeout repair was agent-led and locally tested under the authorized fallback.

Use Node 24 or later. From project/, run npm test and npm start, then open http://127.0.0.1:4317 in ChatGPT's internal browser. No package installation is needed. The preserved test run has 36 passing tests, including an eight-second stalled-coordinator regression and a late-grant/no-Qloo assertion. Live and quota attestation flags are false and all quota caps are 0.

Read project/README.md and submission/LIVE-ACCEPTANCE-PLAN.md before any live setup. Keep keys and real Qloo responses outside public source. The one-row quota counter is locally tested, not verified in the actual Cloudflare runtime. No paid resources are authorized.

This ZIP was prepared locally for review. It was not uploaded, published or submitted. manifest.json records hashes for every other archived file. MIT applies to this original code and synthetic fixtures, not Qloo data or third-party rights.
'@
Add-Type -AssemblyName System.IO.Compression
$qlooFile = [System.IO.File]::Open($qlooArchivePath,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
$qlooZip = [System.IO.Compression.ZipArchive]::new($qlooFile,[System.IO.Compression.ZipArchiveMode]::Create,$false)
$qlooBundleManifest = [System.Collections.Generic.List[object]]::new()
function Add-QlooBytes([string]$EntryName,[byte[]]$Data) {
  $qlooEntry = $qlooZip.CreateEntry($EntryName,[System.IO.Compression.CompressionLevel]::Optimal)
  $qlooEntryStream = $qlooEntry.Open()
  try { $qlooEntryStream.Write($Data,0,$Data.Length) } finally { $qlooEntryStream.Dispose() }
  $qlooHasher = [System.Security.Cryptography.SHA256]::Create()
  try { $qlooHash = [System.BitConverter]::ToString($qlooHasher.ComputeHash($Data)).Replace('-','').ToLowerInvariant() } finally { $qlooHasher.Dispose() }
  $qlooBundleManifest.Add([PSCustomObject]@{path=$EntryName;sha256=$qlooHash})
}
try {
  foreach ($qlooInput in $qlooInputs) { Add-QlooBytes $qlooInput.entry ([System.IO.File]::ReadAllBytes($qlooInput.path)) }
  Add-QlooBytes 'README.md' ([System.Text.Encoding]::UTF8.GetBytes($qlooReadme))
  $qlooManifestJson = ConvertTo-Json -InputObject @($qlooBundleManifest.ToArray()) -Depth 3
  $qlooManifestEntry = $qlooZip.CreateEntry('manifest.json')
  $qlooManifestStream = $qlooManifestEntry.Open()
  try { $qlooManifestBytes=[System.Text.Encoding]::UTF8.GetBytes($qlooManifestJson);$qlooManifestStream.Write($qlooManifestBytes,0,$qlooManifestBytes.Length) } finally { $qlooManifestStream.Dispose() }
} finally { $qlooZip.Dispose() }
$qlooReadZip = [System.IO.Compression.ZipArchive]::new([System.IO.File]::OpenRead($qlooArchivePath),[System.IO.Compression.ZipArchiveMode]::Read,$false)
try {
  foreach ($qlooExpected in $qlooBundleManifest) {
    $qlooReadStream=$qlooReadZip.GetEntry($qlooExpected.path).Open();$qlooVerifyHasher=[System.Security.Cryptography.SHA256]::Create()
    try { $qlooVerified=[System.BitConverter]::ToString($qlooVerifyHasher.ComputeHash($qlooReadStream)).Replace('-','').ToLowerInvariant() } finally { $qlooReadStream.Dispose();$qlooVerifyHasher.Dispose() }
    if ($qlooVerified -cne $qlooExpected.sha256) { throw "Archive mismatch: $($qlooExpected.path)" }
  }
  if ($qlooReadZip.Entries.Count -ne $qlooBundleManifest.Count+1) { throw 'Unexpected archive entry count.' }
} finally { $qlooReadZip.Dispose() }
[PSCustomObject]@{archive=$qlooArchivePath;files_verified=$qlooBundleManifest.Count;archive_sha256=(Get-FileHash -LiteralPath $qlooArchivePath -Algorithm SHA256).Hash.ToLowerInvariant();scope='Local synthetic pre-key 0.1.1 timeout repair; not published or submitted'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $qlooEventRoot 'evidence\release-package-check-v0.1.1.json') -Encoding utf8
Write-Output "Verified local package: $qlooArchivePath"
