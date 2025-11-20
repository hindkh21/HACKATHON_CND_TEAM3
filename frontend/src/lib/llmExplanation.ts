/**
 * Generate attack explanation and fix proposal using LLM
 */
export async function generateExplanation(
  rawLog: string,
  bugType: string,
  severity: string
): Promise<{ explanation: string; fix_proposal: string }> {
  try {
    const apiKey = import.meta.env.VITE_OVH_LLM_API_KEY;
    const endpoint = import.meta.env.VITE_OVH_LLM_ENDPOINT || 'https://llama-3-1-8b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1/chat/completions';
    const modelName = import.meta.env.VITE_OVH_LLM_MODEL || 'Llama-3.1-8B-Instruct';

    if (!apiKey) {
      console.error('❌ API key not configured');
      return getFallbackExplanation(bugType);
    }

    const systemPrompt = `Tu es un expert en cybersécurité. Tu analyses des logs de pare-feu pour expliquer les attaques détectées.

Ton rôle:
1. Analyser le log brut fourni
2. Expliquer l'attaque de manière simple et compréhensible (2-3 phrases max)
3. Proposer une solution concrète pour bloquer/résoudre l'attaque (1-2 phrases)

Réponds UNIQUEMENT avec un JSON dans ce format exact:
{
  "explanation": "explication de l'attaque en français",
  "fix_proposal": "solution concrète pour corriger le problème"
}

Ne fournis AUCUN autre texte en dehors du JSON.`;

    const userPrompt = `Log brut: ${rawLog}

Type d'attaque détecté: ${bugType}
Sévérité: ${severity}

Analyse ce log et fournis une explication et une solution.`;

    console.log('🤖 Generating explanation with LLM...');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.3  // Lower temperature for more consistent JSON output
      })
    });

    if (!response.ok) {
      console.error('❌ LLM API error:', response.status);
      return getFallbackExplanation(bugType);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    console.log('✅ LLM response received');

    // Try to parse JSON from response
    try {
      // Remove markdown code blocks if present
      let jsonContent = content;
      if (content.includes('```json')) {
        jsonContent = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonContent = content.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonContent);
      
      if (parsed.explanation && parsed.fix_proposal) {
        return {
          explanation: parsed.explanation,
          fix_proposal: parsed.fix_proposal
        };
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse LLM JSON response, using fallback');
    }

    return getFallbackExplanation(bugType);

  } catch (error) {
    console.error('💥 Error generating explanation:', error);
    return getFallbackExplanation(bugType);
  }
}

/**
 * Fallback explanations if LLM is unavailable
 */
function getFallbackExplanation(bugType: string): { explanation: string; fix_proposal: string } {
  const fallbacks: Record<string, { explanation: string; fix_proposal: string }> = {
    sql_injection: {
      explanation: "Un pirate tente de manipuler votre base de données en insérant des commandes malveillantes.",
      fix_proposal: "Utiliser des requêtes préparées, valider toutes les entrées, activer WAF."
    },
    xss: {
      explanation: "Un pirate essaie d'injecter du code malveillant dans votre site web pour voler des informations.",
      fix_proposal: "Nettoyer et échapper toutes les entrées utilisateur, implémenter CSP."
    },
    brut_force_ssh: {
      explanation: "Un attaquant tente de deviner votre mot de passe en essayant des milliers de combinaisons.",
      fix_proposal: "Bloquer l'IP après plusieurs tentatives, implémenter l'authentification à deux facteurs."
    },
    port_scan: {
      explanation: "Quelqu'un essaie de trouver les portes d'entrée ouvertes de votre système informatique.",
      fix_proposal: "Bloquer l'IP source et activer la détection de scan avancée."
    },
    malware_download: {
      explanation: "Un fichier dangereux tente d'être téléchargé sur votre système.",
      fix_proposal: "Bloquer le téléchargement, scanner avec antivirus, mettre en quarantaine."
    },
    ddos: {
      explanation: "Votre système reçoit une avalanche de demandes simultanées pour le faire tomber.",
      fix_proposal: "Activer la limitation de débit, filtrage géographique, et protection DDoS du CDN."
    },
    unauthorized_access: {
      explanation: "Tentative d'accès non autorisé détectée.",
      fix_proposal: "Bloquer l'IP source et renforcer les contrôles d'authentification."
    }
  };

  return fallbacks[bugType] || {
    explanation: `Attaque de type ${bugType} détectée.`,
    fix_proposal: "Bloquer l'IP source et analyser les logs pour plus de détails."
  };
}
