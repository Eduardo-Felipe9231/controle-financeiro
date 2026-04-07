let config = JSON.parse(localStorage.getItem("config")) || {
  fechamento: 10,
  vencimento: 20
};

let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
let recorrentes = JSON.parse(localStorage.getItem("recorrentes")) || [];

let dataAtual = new Date();
let mes = dataAtual.getMonth();
let ano = dataAtual.getFullYear();

let grafico;

function criarDataLocal(dataString) {
  const [ano, mes, dia] = dataString.split("-");
  return new Date(ano, mes - 1, dia);
}

function mudarMes(valor) {
  mes += valor;
  if (mes > 11) { mes = 0; ano++; }
  if (mes < 0) { mes = 11; ano--; }
  atualizarTela();
}

function formatarMes() {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${meses[mes]} ${ano}`;
}

function filtrarPorMes() {
  return transacoes.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() === mes && d.getFullYear() === ano;
  });
}

function calcularDataFatura(dataCompra) {
  let m = dataCompra.getMonth();
  let a = dataCompra.getFullYear();

  if (dataCompra.getDate() > config.fechamento) m++;

  if (m > 11) { m = 0; a++; }

  return new Date(a, m, config.vencimento);
}

function gerarRecorrentes() {
  recorrentes.forEach(r => {
    const d = new Date(ano, mes, r.dia);
    const f = d.toISOString().split("T")[0];

    if (!transacoes.some(t => t.descricao === r.descricao && t.data === f)) {
      transacoes.push({ ...r, data: f });
    }
  });

  localStorage.setItem("transacoes", JSON.stringify(transacoes));
}

function atualizarGrafico(e, s, f) {
  const ctx = document.getElementById("graficoFinanceiro");
  if (!ctx) return;

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Entradas","Saídas","Fatura"],
      datasets: [{
        data: [e,s,f],
        backgroundColor: ["#00ff88","#ff4d4d","#ffaa00"]
      }]
    }
  });
}

function gerarInsights(e, s, f) {
  const el = document.getElementById("insights");
  if (!el) return;

  el.innerHTML = "";

  if (s > e) el.innerHTML += "<li>⚠️ Gastando mais do que ganha</li>";
  if (f > e * 0.5) el.innerHTML += "<li>💳 Fatura alta</li>";
  if (e > s) el.innerHTML += "<li>💰 Você economizou</li>";
}

function atualizarTela() {
  gerarRecorrentes();

  document.getElementById("mesAtual").innerText = formatarMes();

  let e = 0, s = 0, f = 0;

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  filtrarPorMes().forEach(t => {
    const i = transacoes.indexOf(t);

    const li = document.createElement("li");
    li.innerHTML = `${t.descricao} - R$ ${t.valor.toFixed(2)}
    <button onclick="removerTransacao(${i})">🗑️</button>`;

    lista.appendChild(li);

    if (t.tipo === "entrada") e += t.valor;
    else {
      s += t.valor;
      if (t.origem === "credito") f += t.valor;
    }
  });

  document.getElementById("entradas").innerText = e.toFixed(2);
  document.getElementById("saidas").innerText = s.toFixed(2);

  const saldo = e - s;
  const saldoEl = document.getElementById("saldo");
  saldoEl.innerText = saldo.toFixed(2);
  saldoEl.style.color = saldo >= 0 ? "#00ff88" : "#ff4d4d";

  document.getElementById("fatura").innerText = f.toFixed(2);

  atualizarGrafico(e,s,f);
  gerarInsights(e,s,f);
}

function adicionarTransacao() {
  const d = document.getElementById("descricao").value;
  const v = parseFloat(document.getElementById("valor").value);
  const t = document.getElementById("tipo").value;
  const data = document.getElementById("data").value;
  const p = parseInt(document.getElementById("parcelas").value) || 1;

  const vp = v / p;

  for (let i=0;i<p;i++) {
    let dp = criarDataLocal(data);
    dp.setMonth(dp.getMonth()+i);

    let df = t==="credito"?calcularDataFatura(dp):dp;

    transacoes.push({
      descricao: p>1?`${d} (${i+1}/${p})`:d,
      valor: vp,
      tipo: t==="credito"?"saida":t,
      data: df.toISOString().split("T")[0],
      origem: t
    });
  }

  localStorage.setItem("transacoes", JSON.stringify(transacoes));
  atualizarTela();
}

function adicionarRecorrente() {
  const d = document.getElementById("descricao").value;
  const v = parseFloat(document.getElementById("valor").value);
  const t = document.getElementById("tipo").value;
  const dia = criarDataLocal(document.getElementById("data").value).getDate();

  recorrentes.push({ descricao:d, valor:v, tipo:t, dia });

  localStorage.setItem("recorrentes", JSON.stringify(recorrentes));
}

function removerTransacao(i) {
  transacoes.splice(i,1);
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
  atualizarTela();
}

function salvarConfig() {
  config = {
    fechamento: +document.getElementById("fechamento").value,
    vencimento: +document.getElementById("vencimento").value
  };

  localStorage.setItem("config", JSON.stringify(config));
}

atualizarTela();