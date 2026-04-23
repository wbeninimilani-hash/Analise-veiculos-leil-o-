import { useState } from "react";

const formatCurrency = (value) => {
  const num = value.replace(/\D/g, "");
  return num ? `R$ ${parseInt(num).toLocaleString("pt-BR")}` : "";
};

const parseCurrency = (value) => {
  return parseInt(value.replace(/\D/g, "")) || 0;
};

export default function App() {
  const [form, setForm] = useState({
    marca: "",
    modelo: "",
    ano: "",
    lanceInicial: "",
    valorFipe: "",
    valorMercado: "",
    kmRodados: "",
    estado: "",
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["lanceInicial", "valorFipe", "valorMercado"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: formatCurrency(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const analyzeVehicle = async () => {
    if (!form.marca || !form.modelo || !form.ano || !form.lanceInicial || !form.valorFipe) {
      setError("Por favor, preencha os campos obrigatórios: Marca, Modelo, Ano, Lance Inicial e Valor FIPE.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    const lanceNum = parseCurrency(form.lanceInicial);
    const fipeNum = parseCurrency(form.valorFipe);
    const mercadoNum = parseCurrency(form.valorMercado);

    const pctFipe = fipeNum ? ((lanceNum / fipeNum) * 100).toFixed(1) : "N/A";
    const pctMercado = mercadoNum ? ((lanceNum / mercadoNum) * 100).toFixed(1) : "N/A";

    const prompt = `Você é um consultor especializado em compra e venda de veículos em leilões no Brasil, com profundo conhecimento do mercado automotivo brasileiro, tabela FIPE e tendências de mercado.

Analise o seguinte veículo para potencial investimento em leilão:

**DADOS DO VEÍCULO:**
- Marca e Modelo: ${form.marca} ${form.modelo}
- Ano de Fabricação: ${form.ano}
- Lance Inicial no Leilão: ${form.lanceInicial}
- Valor FIPE: ${form.valorFipe}
- Valor Atual de Mercado: ${form.valorMercado || "Não informado"}
- KM Rodados: ${form.kmRodados || "Não informado"}
- Estado de Conservação: ${form.estado || "Não informado"}
- Observações Adicionais: ${form.observacoes || "Nenhuma"}

**INDICADORES CALCULADOS:**
- Lance como % da FIPE: ${pctFipe}%
- Lance como % do Mercado: ${pctMercado}%

Gere um relatório profissional completo em português com as seguintes seções usando markdown:

## 📊 Resumo Executivo
Breve análise da oportunidade de investimento (2-3 frases objetivas).

## 📈 Posição no Mercado
Analise como este veículo se posiciona no mercado atual, considerando:
- Relação lance x FIPE x mercado
- Demanda atual pelo modelo
- Fatores que impactam o valor (ano, km, estado)

## 💰 Recomendação de Lance Máximo
Calcule e justifique o lance máximo recomendado considerando:
- Margem de lucro mínima de 15% sobre o investimento total
- Custos estimados de documentação, IPVA, transferência (~R$ 2.500 a R$ 4.000)
- Possíveis custos de revisão/reparos
- Apresente: Lance Máximo Conservador | Lance Máximo Moderado | Lance Máximo Agressivo

## 🔄 Comparativo com Similares
Compare com veículos similares do mercado, tendências de valorização/desvalorização do modelo.

## ⚠️ Alertas e Pontos de Atenção
Liste de 3 a 6 alertas críticos específicos para este veículo/modelo que o comprador deve verificar antes de dar o lance.

## ✅ Veredicto Final
**COMPRAR / COMPRAR COM CAUTELA / EVITAR** - com justificativa objetiva de 2-3 frases.

Seja específico, direto e baseie-se em dados reais do mercado brasileiro. Evite generalidades.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const fullText = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      setResult(fullText);
    } catch (err) {
      setError("Erro ao conectar com a IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} style={{ color: "#e8c547", fontSize: "1rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.5rem", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #333", paddingBottom: "0.3rem" }}>
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} style={{ color: "#fff", fontWeight: 700, margin: "0.4rem 0" }}>{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.startsWith("- ")) {
        const content = line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "$1");
        return (
          <div key={i} style={{ display: "flex", gap: "0.5rem", margin: "0.25rem 0", color: "#ccc", fontSize: "0.88rem" }}>
            <span style={{ color: "#e8c547", flexShrink: 0 }}>›</span>
            <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#fff'>$1</strong>") }} />
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} style={{ height: "0.3rem" }} />;

      const html = line.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#fff'>$1</strong>");
      return <p key={i} style={{ color: "#bbb", fontSize: "0.88rem", margin: "0.2rem 0", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  const inputStyle = {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    color: "#fff",
    padding: "0.6rem 0.75rem",
    fontSize: "0.88rem",
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: "0.35rem",
    fontFamily: "'Oswald', sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#0f0f0f", borderBottom: "1px solid #1a1a1a", padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "36px", height: "36px", background: "#e8c547", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "1.1rem" }}>🏎</span>
        </div>
        <div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Auto<span style={{ color: "#e8c547" }}>Leilão</span> Advisor
          </div>
          <div style={{ fontSize: "0.7rem", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Análise Inteligente de Veículos</div>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* Form Card */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#e8c547", marginBottom: "1.2rem" }}>
            Dados do Veículo
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
            {[
              { label: "Marca *", name: "marca", placeholder: "Ex: Toyota" },
              { label: "Modelo *", name: "modelo", placeholder: "Ex: Corolla XEi" },
              { label: "Ano de Fabricação *", name: "ano", placeholder: "Ex: 2021" },
              { label: "KM Rodados", name: "kmRodados", placeholder: "Ex: 45000" },
            ].map((f) => (
              <div key={f.name}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  type="text"
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#e8c547")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.9rem", marginTop: "0.9rem" }}>
            {[
              { label: "Lance Inicial *", name: "lanceInicial", placeholder: "R$ 0" },
              { label: "Valor FIPE *", name: "valorFipe", placeholder: "R$ 0" },
              { label: "Valor de Mercado", name: "valorMercado", placeholder: "R$ 0" },
            ].map((f) => (
              <div key={f.name}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  type="text"
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  style={{ ...inputStyle, color: "#e8c547" }}
                  onFocus={(e) => (e.target.style.borderColor = "#e8c547")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: "0.9rem" }}>
            <label style={labelStyle}>Estado de Conservação</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "#e8c547")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
            >
              <option value="">Selecione...</option>
              <option value="Excelente">Excelente</option>
              <option value="Bom">Bom</option>
              <option value="Regular">Regular</option>
              <option value="Com avarias leves">Com avarias leves</option>
              <option value="Com avarias moderadas">Com avarias moderadas</option>
              <option value="Sinistrado">Sinistrado / Batido</option>
            </select>
          </div>

          <div style={{ marginTop: "0.9rem" }}>
            <label style={labelStyle}>Observações Adicionais</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              placeholder="Ex: único dono, IPVA pago, revisões em dia, airbag disparado..."
              rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = "#e8c547")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Quick indicators */}
          {form.lanceInicial && form.valorFipe && (
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[
                {
                  label: "Lance / FIPE",
                  value: `${((parseCurrency(form.lanceInicial) / parseCurrency(form.valorFipe)) * 100).toFixed(1)}%`,
                  color: parseCurrency(form.lanceInicial) / parseCurrency(form.valorFipe) < 0.75 ? "#4ade80" : parseCurrency(form.lanceInicial) / parseCurrency(form.valorFipe) < 0.90 ? "#e8c547" : "#f87171",
                },
                form.valorMercado && {
                  label: "Lance / Mercado",
                  value: `${((parseCurrency(form.lanceInicial) / parseCurrency(form.valorMercado)) * 100).toFixed(1)}%`,
                  color: parseCurrency(form.lanceInicial) / parseCurrency(form.valorMercado) < 0.80 ? "#4ade80" : "#e8c547",
                },
              ].filter(Boolean).map((ind) => (
                <div key={ind.label} style={{ background: "#0a0a0a", border: `1px solid ${ind.color}22`, borderRadius: "4px", padding: "0.4rem 0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{ind.label}</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: ind.color, fontFamily: "'Oswald', sans-serif" }}>{ind.value}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ marginTop: "0.9rem", background: "#1a0a0a", border: "1px solid #f8717144", borderRadius: "4px", padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "#f87171" }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={analyzeVehicle}
            disabled={loading}
            style={{
              marginTop: "1.2rem",
              width: "100%",
              background: loading ? "#1a1a1a" : "#e8c547",
              color: loading ? "#555" : "#000",
              border: "none",
              borderRadius: "4px",
              padding: "0.85rem",
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "⟳  Analisando veículo..." : "Gerar Análise Completa →"}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem", animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontFamily: "'Oswald', sans-serif", color: "#555", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Consultando mercado e gerando relatório...</div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{ background: "#111", border: "1px solid #e8c54722", borderRadius: "8px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1e1e1e" }}>
              <div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.75rem", color: "#e8c547", letterSpacing: "0.12em", textTransform: "uppercase" }}>Relatório de Análise</div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginTop: "0.15rem" }}>
                  {form.marca} {form.modelo} {form.ano}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}>Lance Inicial</div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1rem", color: "#e8c547", fontWeight: 700 }}>{form.lanceInicial}</div>
              </div>
            </div>
            <div>{renderMarkdown(result)}</div>
            <div style={{ marginTop: "1.5rem", paddingTop: "0.75rem", borderTop: "1px solid #1e1e1e", fontSize: "0.7rem", color: "#333", textAlign: "center", letterSpacing: "0.05em" }}>
              Análise gerada por IA · Consulte sempre um especialista antes de finalizar a compra
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
