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
    marca: "", modelo: "", ano: "", lanceInicial: "",
    valorFipe: "", valorMercado: "", kmRodados: "",
    estado: "", observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["lanceInicial", "valorFipe", "valorMercado"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: formatCurrency(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const analyzeVehicle = () => {
    setLoading(true);
    setTimeout(() => {
      const fipeNum = parseCurrency(form.valorFipe);
      const lanceNum = parseCurrency(form.lanceInicial);
      const porcentagem = ((lanceNum / fipeNum) * 100).toFixed(1);
      
      setResult(`## 📊 Resumo Executivo\nVeículo: ${form.marca} ${form.modelo} ${form.ano}\nLance: ${form.lanceInicial} (${porcentagem}% da FIPE).`);
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#e8c547", textAlign: "center", fontSize: "1.5rem" }}>🏎 AutoLeilão Advisor</h1>
      <div style={{ background: "#111", padding: "20px", borderRadius: "8px", border: "1px solid #333", marginTop: "15px" }}>
        <label style={{ color: "#666", fontSize: "12px", display: "block" }}>MARCA/MODELO</label>
        <input name="marca" placeholder="Marca" onChange={handleChange} style={{ width: "100%", background: "#222", color: "#fff", border: "1px solid #444", padding: "10px", marginBottom: "10px" }} />
        <input name="modelo" placeholder="Modelo" onChange={handleChange} style={{ width: "100%", background: "#222", color: "#fff", border: "1px solid #444", padding: "10px", marginBottom: "10px" }} />
        
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#666", fontSize: "12px" }}>LANCE INICIAL</label>
            <input name="lanceInicial" value={form.lanceInicial} onChange={handleChange} style={{ width: "100%", background: "#222", color: "#e8c547", border: "1px solid #444", padding: "10px" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#666", fontSize: "12px" }}>VALOR FIPE</label>
            <input name="valorFipe" value={form.valorFipe} onChange={handleChange} style={{ width: "100%", background: "#222", color: "#e8c547", border: "1px solid #444", padding: "10px" }} />
          </div>
        </div>

        <button onClick={analyzeVehicle} style={{ width: "100%", background: "#e8c547", color: "#000", border: "none", padding: "15px", fontWeight: "bold", borderRadius: "4px", marginTop: "20px" }}>
          {loading ? "PROCESSANDO..." : "ANALISAR AGORA"}
        </button>
      </div>
      {result && <div style={{ marginTop: "20px", padding: "15px", background: "#111", border: "1px solid #e8c547", borderRadius: "8px", whiteSpace: "pre-wrap" }}>{result}</div>}
    </div>
  );
}
