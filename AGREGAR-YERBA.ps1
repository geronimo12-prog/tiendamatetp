$ErrorActionPreference = "Stop"

$indexPath = Join-Path $PSScriptRoot "index.html"
$stylesPath = Join-Path $PSScriptRoot "styles.css"

if (-not (Test-Path $indexPath)) {
    Write-Host "ERROR: No se encontró index.html en esta carpeta." -ForegroundColor Red
    Write-Host "Copiá este archivo dentro de la carpeta principal de tiendamatetp y ejecutalo de nuevo."
    Read-Host "Presioná Enter para salir"
    exit 1
}

if (-not (Test-Path $stylesPath)) {
    Write-Host "ERROR: No se encontró styles.css en esta carpeta." -ForegroundColor Red
    Write-Host "Copiá este archivo dentro de la carpeta principal de tiendamatetp y ejecutalo de nuevo."
    Read-Host "Presioná Enter para salir"
    exit 1
}

$index = Get-Content $indexPath -Raw -Encoding UTF8
$styles = Get-Content $stylesPath -Raw -Encoding UTF8

$marker = '    <section class="combo-builder section" id="combo">'

$section = @'
    <section class="yerba-coming section reveal" id="yerba">
      <div class="yerba-coming-copy">
        <span class="yerba-coming-pill">Próximamente</span>
        <span class="eyebrow dark">Lo que le faltaba a la ronda</span>
        <h2>Muy pronto, también yerbas.</h2>
        <p>Estamos preparando una selección de yerbas para completar tu experiencia matera. Cuando vuelvan a estar disponibles, las vas a encontrar acá.</p>
        <div class="yerba-coming-note">
          <span aria-hidden="true">🌿</span>
          <strong>Próximamente en tiendamatetp</strong>
        </div>
      </div>
      <div class="yerba-coming-art" aria-hidden="true">
        <span class="yerba-leaf yerba-leaf-one"></span>
        <span class="yerba-leaf yerba-leaf-two"></span>
        <span class="yerba-leaf yerba-leaf-three"></span>
        <div class="yerba-pack">
          <small>SELECCIÓN</small>
          <strong>YERBA</strong>
          <span>tiendamatetp</span>
        </div>
      </div>
    </section>

'@

$css = @'

/* Próximamente: yerbas */
.yerba-coming{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);
  align-items:center;
  gap:clamp(35px,7vw,95px);
  overflow:hidden;
  background:
    radial-gradient(circle at 85% 15%,rgba(212,170,95,.24),transparent 30%),
    linear-gradient(135deg,#eef0df,#f8f2e7 52%,#e6dcc6);
  border-top:1px solid var(--line);
  border-bottom:1px solid var(--line);
}
.yerba-coming:before{
  content:"";
  position:absolute;
  width:420px;
  height:420px;
  right:-130px;
  bottom:-210px;
  border-radius:50%;
  border:1px solid rgba(31,107,70,.18);
  box-shadow:0 0 0 42px rgba(31,107,70,.045),0 0 0 84px rgba(31,107,70,.025);
}
.yerba-coming-copy{position:relative;z-index:2;max-width:760px}
.yerba-coming-pill{
  display:inline-flex;
  margin-bottom:18px;
  padding:9px 14px;
  border-radius:999px;
  background:#1f6b46;
  color:#fff;
  font-size:11px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  box-shadow:0 10px 25px rgba(31,107,70,.2);
}
.yerba-coming h2{
  max-width:780px;
  margin:14px 0 22px;
  font-size:clamp(48px,6.5vw,92px);
  line-height:.95;
  letter-spacing:-.045em;
}
.yerba-coming-copy>p{
  max-width:680px;
  margin:0;
  font-size:clamp(16px,1.5vw,19px);
  line-height:1.75;
  color:rgba(29,23,18,.68);
}
.yerba-coming-note{
  display:inline-flex;
  align-items:center;
  gap:10px;
  margin-top:30px;
  padding:14px 18px;
  border:1px solid rgba(31,107,70,.2);
  border-radius:16px;
  background:rgba(255,255,255,.5);
  backdrop-filter:blur(8px);
}
.yerba-coming-note span{font-size:22px}
.yerba-coming-note strong{font-size:13px}
.yerba-coming-art{
  position:relative;
  min-height:480px;
  display:grid;
  place-items:center;
}
.yerba-pack{
  position:relative;
  z-index:2;
  width:min(290px,72vw);
  aspect-ratio:.72;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:35px;
  text-align:center;
  color:#f6efdf;
  border-radius:26px 26px 38px 38px;
  background:
    linear-gradient(160deg,rgba(255,255,255,.12),transparent 28%),
    linear-gradient(145deg,#2c7550,#174b34);
  border:1px solid rgba(255,255,255,.25);
  box-shadow:0 35px 70px rgba(37,61,40,.25);
  transform:rotate(3deg);
}
.yerba-pack:before{
  content:"";
  position:absolute;
  inset:20px;
  border:1px solid rgba(231,196,119,.55);
  border-radius:18px 18px 28px 28px;
}
.yerba-pack small{
  position:relative;
  font-size:10px;
  letter-spacing:.25em;
  font-weight:800;
  opacity:.75;
}
.yerba-pack strong{
  position:relative;
  margin:16px 0 9px;
  font:900 clamp(42px,6vw,72px)/.9 "Playfair Display",serif;
  color:#e7c477;
}
.yerba-pack span{
  position:relative;
  font:700 17px "Playfair Display",serif;
}
.yerba-leaf{
  position:absolute;
  width:120px;
  height:54px;
  border-radius:100% 0 100% 0;
  background:linear-gradient(135deg,#4d966b,#1f6b46);
  box-shadow:0 18px 35px rgba(31,107,70,.18);
}
.yerba-leaf:after{
  content:"";
  position:absolute;
  left:16%;
  right:10%;
  top:50%;
  height:1px;
  background:rgba(255,255,255,.45);
  transform:rotate(-18deg);
}
.yerba-leaf-one{left:4%;top:18%;transform:rotate(-24deg)}
.yerba-leaf-two{right:2%;top:30%;transform:rotate(38deg) scale(.82)}
.yerba-leaf-three{left:13%;bottom:10%;transform:rotate(18deg) scale(.65)}
html[data-theme="noche"] .yerba-coming{
  background:
    radial-gradient(circle at 85% 15%,rgba(212,170,95,.12),transparent 30%),
    linear-gradient(135deg,#1b241c,#241b15 55%,#17120e);
}
html[data-theme="noche"] .yerba-coming-copy>p{color:rgba(255,255,255,.68)}
html[data-theme="noche"] .yerba-coming-note{
  background:rgba(255,255,255,.05);
  border-color:rgba(255,255,255,.12);
}
@media(max-width:850px){
  .yerba-coming{grid-template-columns:1fr;text-align:left}
  .yerba-coming-art{min-height:390px}
}
@media(max-width:520px){
  .yerba-coming h2{font-size:48px}
  .yerba-coming-art{min-height:330px}
  .yerba-pack{width:220px}
}

'@

if ($index -notmatch 'id="yerba"') {
    if (-not $index.Contains($marker)) {
        Write-Host "ERROR: No encontré el lugar correcto para insertar la sección." -ForegroundColor Red
        Read-Host "Presioná Enter para salir"
        exit 1
    }
    Copy-Item $indexPath "$indexPath.bak" -Force
    $index = $index.Replace($marker, $section + $marker)
    Set-Content $indexPath $index -Encoding UTF8
    Write-Host "Sección de yerba agregada a index.html." -ForegroundColor Green
} else {
    Write-Host "La sección de yerba ya estaba agregada." -ForegroundColor Yellow
}

if ($styles -notmatch '/\* Próximamente: yerbas \*/') {
    Copy-Item $stylesPath "$stylesPath.bak" -Force
    Add-Content $stylesPath $css -Encoding UTF8
    Write-Host "Estilos de yerba agregados a styles.css." -ForegroundColor Green
} else {
    Write-Host "Los estilos de yerba ya estaban agregados." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "LISTO. Abrí index.html para probarlo." -ForegroundColor Cyan
Write-Host "Después subí a GitHub solamente index.html y styles.css."
Read-Host "Presioná Enter para cerrar"
