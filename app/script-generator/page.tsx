'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Download, Loader2, Sparkles, FileCode2 } from 'lucide-react'
import { toast } from 'sonner'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const NETWORKS = ['Monad', 'Arbitrum', 'Base', 'Ethereum', 'Optimism', 'Polygon']
const SCRIPT_TYPES = [
  'Multi-wallet Swap',
  'Multi-wallet Mint',
  'Multi-wallet Claim',
  'Custom Interaction',
]

export default function ScriptGeneratorPage() {
  const [input, setInput] = useState('')
  const [inputTab, setInputTab] = useState('ABI')
  const [network, setNetwork] = useState('Monad')
  const [scriptType, setScriptType] = useState('Multi-wallet Swap')
  const [generatedScript, setGeneratedScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<{ model: string; tokensUsed: number; latencyMs: number } | null>(null)

  const charCount = input.length
  const tokenEstimate = Math.ceil(charCount / 4)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, network, scriptType }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setGeneratedScript(data.script)
      setMeta({ model: data.model, tokensUsed: data.tokensUsed, latencyMs: data.latencyMs })
      toast.success('Script generated successfully')
    } catch {
      toast.error('Failed to generate script')
    } finally {
      setLoading(false)
    }
  }

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed — check browser permissions')
    }
  }

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'automation.js'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded automation.js')
  }

  return (
    <div className="p-6 min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left: Input */}
        <Card className="bg-slate-900/60 border-slate-800 flex flex-col">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-200">Input</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex flex-col gap-4 flex-1">
            {/* Input type tabs */}
            <Tabs value={inputTab} onValueChange={setInputTab}>
              <TabsList className="bg-slate-800 border-slate-700 h-8">
                {['ABI', 'Docs', 'Source', 'GitHub URL'].map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="text-xs h-6 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Textarea */}
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste Smart Contract ABI, documentation, or GitHub source code here. MiMo's 1M token context window can handle entire repositories."
                className="min-h-[360px] h-full resize-none bg-slate-950 border-slate-700 text-slate-300 placeholder:text-slate-600 font-mono text-xs leading-relaxed focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/40"
              />
            </div>

            {/* Char/token counter */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>{charCount.toLocaleString()} chars</span>
              <span className="text-slate-700">·</span>
              <span>~{tokenEstimate.toLocaleString()} tokens</span>
              <span className="text-slate-700">·</span>
              <span className="text-indigo-400">1M ctx window</span>
            </div>

            {/* Network + Script Type selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Network</label>
                <Select value={network} onValueChange={(v) => v && setNetwork(v)}>
                  <SelectTrigger className="h-8 bg-slate-950 border-slate-700 text-slate-300 text-xs focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {NETWORKS.map((n) => (
                      <SelectItem key={n} value={n} className="text-xs text-slate-300 focus:bg-slate-800 focus:text-slate-100">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Script Type</label>
                <Select value={scriptType} onValueChange={(v) => v && setScriptType(v)}>
                  <SelectTrigger className="h-8 bg-slate-950 border-slate-700 text-slate-300 text-xs focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {SCRIPT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs text-slate-300 focus:bg-slate-800 focus:text-slate-100">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-400 text-white gap-2 w-full"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Script</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Output */}
        <Card className="bg-slate-900/60 border-slate-800 flex flex-col">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-200">Generated Script</CardTitle>
              {generatedScript && (
                <div className="flex items-center gap-2">
                  {meta && (
                    <div className="flex items-center gap-1.5 mr-2">
                      <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                        {meta.model}
                      </Badge>
                      <span className="text-[10px] text-slate-500">{meta.tokensUsed.toLocaleString()} tokens · {meta.latencyMs}ms</span>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-slate-800" onClick={copyScript} title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-slate-800" onClick={downloadScript} title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {generatedScript && (
              <p className="text-[11px] text-slate-500 font-mono mt-1">automation.js</p>
            )}
          </CardHeader>
          <CardContent className="px-0 pb-0 flex-1 overflow-hidden">
            {generatedScript ? (
              <div className="h-full overflow-auto">
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '16px 20px',
                    background: 'transparent',
                    fontSize: '11px',
                    lineHeight: '1.7',
                    minHeight: '100%',
                  }}
                  showLineNumbers
                  lineNumberStyle={{ color: '#374151', fontSize: '10px', paddingRight: '16px' }}
                >
                  {generatedScript}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-3 px-8 text-center">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <FileCode2 className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-sm text-slate-500">
                  Paste an ABI on the left and click Generate to produce a multi-wallet automation script.
                </p>
                <p className="text-xs text-slate-600">
                  Powered by MiMo LLM with 1M token context
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
