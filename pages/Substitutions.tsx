import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Wheat, Milk, Ban, DollarSign, Sparkles } from 'lucide-react';

const SubstitutionCard: React.FC<{ title: string; icon: React.ReactNode; items: { original: string; economic: string; costBenefit: string; }[] }> = ({ title, icon, items }) => (
  <div className="bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-800 mb-4">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-800">
      <div className="text-neon-400 bg-black border border-neon-400 p-2 rounded-lg shadow-[0_0_10px_rgba(204,255,0,0.2)]">{icon}</div>
      <h3 className="font-bold text-lg text-white">{title}</h3>
    </div>
    <div className="space-y-6">
      {items.map((item, idx) => (
        <div key={idx} className="bg-black p-4 rounded-xl border border-neutral-800">
          <p className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-400 rounded-full shadow-[0_0_5px_rgba(204,255,0,0.8)]"></span>
            {item.original}
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-start gap-2">
               <DollarSign size={16} className="text-green-500 mt-0.5 shrink-0" />
               <div>
                 <span className="font-bold text-green-500 block text-xs uppercase">Econômico</span>
                 <span className="text-neutral-400">{item.economic}</span>
               </div>
            </div>
            <div className="flex items-start gap-2">
               <Sparkles size={16} className="text-purple-400 mt-0.5 shrink-0" />
               <div>
                 <span className="font-bold text-purple-400 block text-xs uppercase">Custo-Benefício</span>
                 <span className="text-neutral-400">{item.costBenefit}</span>
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Substitutions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 bg-black min-h-screen text-white">
      <div className="bg-neutral-900 p-4 sticky top-0 z-10 shadow-lg border-b border-neutral-800 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors"><ArrowLeft size={24} /></button>
        <div>
            <h1 className="text-xl font-bold text-white">Trocas Inteligentes</h1>
            <p className="text-xs text-neutral-500">Manual de substituições</p>
        </div>
      </div>

      <div className="p-4 animate-fade-in">
        <div className="bg-blue-900/20 text-blue-300 p-4 rounded-xl mb-6 text-sm leading-relaxed border border-blue-900/50">
            Guia para adaptar receitas ao seu bolso mantendo a qualidade.
        </div>
        <SubstitutionCard title="Queijos & Derivados" icon={<Milk size={20} />} items={[{ original: "Muçarela", economic: "Queijo prato, minas frescal.", costBenefit: "Queijo minas padrão light, cottage." }, { original: "Requeijão", economic: "Creme de ricota caseiro.", costBenefit: "Requeijão light ou homus." }]} />
        <SubstitutionCard title="Cereais & Massas" icon={<Wheat size={20} />} items={[{ original: "Arroz Branco", economic: "Arroz agulhinha.", costBenefit: "Arroz integral." }, { original: "Macarrão Comum", economic: "Trigo simples.", costBenefit: "Integral." }, { original: "Farinha de Trigo", economic: "Refinada.", costBenefit: "Aveia." }]} />
        <SubstitutionCard title="Proteínas Vegetais" icon={<Leaf size={20} />} items={[{ original: "Carne Vermelha", economic: "Feijão, ovo.", costBenefit: "Grão-de-bico, lentilha." }, { original: "Frango Desfiado", economic: "Abóbora refogada.", costBenefit: "Soja texturizada." }, { original: "Ovo", economic: "O próprio ovo.", costBenefit: "Tofu." }]} />
        <SubstitutionCard title="Frutas & Vegetais" icon={<Leaf size={20} />} items={[{ original: "Brócolis", economic: "Talos/Couve.", costBenefit: "Couve-flor." }, { original: "Morango", economic: "Banana.", costBenefit: "Manga." }, { original: "Abacate", economic: "Maionese cenoura.", costBenefit: "Guacamole simples." }]} />
        <SubstitutionCard title="Leites & Temperos" icon={<Milk size={20} />} items={[{ original: "Leite Integral", economic: "Em pó.", costBenefit: "Desnatado." }, { original: "Azeite", economic: "Soja.", costBenefit: "Girassol." }]} />
      </div>
    </div>
  );
};

export default Substitutions;