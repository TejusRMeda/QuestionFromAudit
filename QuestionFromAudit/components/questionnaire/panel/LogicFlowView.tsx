"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import { EditableQuestion } from "@/types/editPanel";
import {
  parseCharacteristics,
  CharacteristicSource,
} from "@/lib/enableWhen";

// ═══════ TYPES ═══════

interface LogicFlowViewProps {
  questions: EditableQuestion[];
  selectedQuestion: EditableQuestion | null;
  onSelectQuestion: (question: EditableQuestion) => void;
  characteristicMap: Map<string, CharacteristicSource>;
}

interface ParentInfo {
  question: EditableQuestion;
  conditions: { optionText?: string; operator: string; value?: string }[];
  logic: string;
}

interface OptionBranch {
  optionText: string;
  children: EditableQuestion[];
}

// ═══════ LAYOUT CONSTANTS ═══════

const CARD_W = 210;
const HERO_W = 250;
const COND_W = 180;
const OPTION_W = 120;
const COL_GAP = 60;
const ROW_GAP = 20;
const CARD_H = 130;
const COND_H = 80;
const OPTION_H = 36;
const MAX_DEPTH = 3;

// ═══════ CUSTOM NODE COMPONENTS ═══════

function ParentCardNode({ data }: { data: Record<string, unknown> }) {
  const question = data.question as EditableQuestion;
  return (
    <div
      className="bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-primary transition-all"
      style={{ width: CARD_W }}
    >
      <Handle type="source" position={Position.Right} id="right" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${getCatBg(question.category)}`}>
        {question.category}
      </div>
      <CardBody question={question} bold={false} />
    </div>
  );
}

function HeroCardNode({ data }: { data: Record<string, unknown> }) {
  const question = data.question as EditableQuestion;
  return (
    <div
      className="bg-base-100 border-2 border-primary rounded-xl overflow-hidden shadow-md ring-2 ring-primary/15"
      style={{ width: HERO_W }}
    >
      <Handle type="target" position={Position.Left} id="left" className="!bg-primary !w-2 !h-2 !border-base-100" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-primary !w-2 !h-2 !border-base-100" />
      <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${getCatBg(question.category)}`}>
        {question.category}
      </div>
      <CardBody question={question} bold={true} />
    </div>
  );
}

function ChildCardNode({ data }: { data: Record<string, unknown> }) {
  const question = data.question as EditableQuestion;
  return (
    <div
      className="bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-primary transition-all"
      style={{ width: CARD_W }}
    >
      <Handle type="target" position={Position.Left} id="left" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${getCatBg(question.category)}`}>
        {question.category}
      </div>
      <CardBody question={question} bold={false} />
    </div>
  );
}

function ConditionBoxNode({ data }: { data: Record<string, unknown> }) {
  const parents = data.parents as ParentInfo[];
  const allConds: { optionText?: string; operator: string; value?: string }[] = [];
  parents.forEach((p) => allConds.push(...p.conditions));
  const logic = parents[0]?.logic || "AND";

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg px-3 py-2 shadow-sm" style={{ width: COND_W }}>
      <Handle type="target" position={Position.Left} id="left" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <div className="text-[9px] font-bold uppercase tracking-widest text-base-content/50 mb-1">Options chosen</div>
      {allConds.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 mb-0.5">
          {i > 0 && (
            <span className={`font-mono text-[8px] font-bold uppercase px-1 py-px rounded ${
              logic === "AND" ? "bg-warning/20 text-warning-content" : "bg-info/20 text-info-content"
            }`}>{logic}</span>
          )}
          <span className="font-mono text-[10px] font-medium text-base-content/70">
            {c.optionText ? `="${c.optionText}"` : `${c.operator} ${c.value || ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function OptionLabelNode({ data }: { data: Record<string, unknown> }) {
  const optionText = data.optionText as string;
  return (
    <div className="bg-base-100 border border-base-300 rounded-lg px-3 py-1.5 shadow-sm" style={{ minWidth: OPTION_W }}>
      <Handle type="target" position={Position.Left} id="left" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      <span className="font-mono text-[11px] font-semibold text-base-content/70">
        ={"\u201C"}{optionText}{"\u201D"}
      </span>
    </div>
  );
}

function AlwaysShownNode() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-success/10 text-success rounded-lg text-[11px] font-semibold">
      <Handle type="source" position={Position.Right} id="right" className="!bg-success !w-2 !h-2 !border-base-100" />
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Always shown
    </div>
  );
}

function NoChildrenNode() {
  return (
    <div className="px-5 py-4 border-2 border-dashed border-base-300 rounded-xl text-[11px] text-base-content/50 text-center">
      <Handle type="target" position={Position.Left} id="left" className="!bg-base-content/30 !w-2 !h-2 !border-base-100" />
      No dependent<br />questions
    </div>
  );
}

function CardBody({ question, bold }: { question: EditableQuestion; bold: boolean }) {
  const options = question.answerOptions?.split("|").map((o) => o.trim()).filter(Boolean) || [];
  return (
    <div className="px-3 py-2.5 flex flex-col gap-1.5">
      {question.suggestionCount > 0 && (
        <div className="flex items-center">
          <span className="text-[9px] font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5 ml-auto">
            {question.suggestionCount}
          </span>
        </div>
      )}
      <p className={`leading-snug line-clamp-3 text-base-content ${bold ? "text-[13px] font-semibold" : "text-[12px] font-medium"}`}>
        {question.questionText}
      </p>
      {options.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {options.map((o) => (
            <span key={o} className="text-[10px] font-medium text-base-content/60 bg-base-200 border border-base-300 px-1.5 py-px rounded-full">
              {o}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getCatBg(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("allerg")) return "bg-error/15 text-gray-600";
  if (lower.includes("medic")) return "bg-success/15 text-gray-600";
  if (lower.includes("health")) return "bg-secondary/15 text-gray-600";
  return "bg-primary/15 text-gray-600";
}

// Node types — MUST be outside component for stable reference
const nodeTypes = {
  parentCard: ParentCardNode,
  heroCard: HeroCardNode,
  childCard: ChildCardNode,
  conditionBox: ConditionBoxNode,
  optionLabel: OptionLabelNode,
  alwaysShown: AlwaysShownNode,
  noChildren: NoChildrenNode,
};

// ═══════ GRAPH BUILDER ═══════

function buildFlowGraph(
  selected: EditableQuestion,
  parents: ParentInfo[],
  getChildBranches: (q: EditableQuestion) => OptionBranch[],
  questionMap: Map<number, EditableQuestion>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const edgeStyle = { stroke: "oklch(0.7 0 0)", strokeWidth: 1.5 };

  let heroX = 0;

  // ── PARENTS + CONDITION BOX ──
  if (parents.length > 0) {
    const parentsHeight = parents.length * CARD_H + (parents.length - 1) * ROW_GAP;
    const parentsStartY = -parentsHeight / 2;
    parents.forEach((p, i) => {
      const id = `parent-${p.question.id}`;
      nodes.push({
        id,
        type: "parentCard",
        position: { x: 0, y: parentsStartY + i * (CARD_H + ROW_GAP) },
        data: { question: p.question, questionId: p.question.id },
      });
      edges.push({
        id: `e-${id}-cond`,
        source: id, sourceHandle: "right",
        target: "cond-box", targetHandle: "left",
        type: "smoothstep", style: edgeStyle,
      });
    });

    nodes.push({
      id: "cond-box",
      type: "conditionBox",
      position: { x: CARD_W + COL_GAP, y: -COND_H / 2 },
      data: { parents },
    });
    edges.push({
      id: "e-cond-hero",
      source: "cond-box", sourceHandle: "right",
      target: "hero", targetHandle: "left",
      type: "smoothstep", style: edgeStyle,
    });

    heroX = CARD_W + COL_GAP + COND_W + COL_GAP;
  } else {
    nodes.push({
      id: "always-shown",
      type: "alwaysShown",
      position: { x: 0, y: -18 },
      data: {},
    });
    edges.push({
      id: "e-always-hero",
      source: "always-shown", sourceHandle: "right",
      target: "hero", targetHandle: "left",
      type: "smoothstep", style: edgeStyle,
    });
    heroX = 160 + COL_GAP;
  }

  // ── HERO ──
  nodes.push({
    id: "hero",
    type: "heroCard",
    position: { x: heroX, y: -CARD_H / 2 },
    data: { question: selected },
  });

  // ── CHILDREN (recursive) ──
  const branches = getChildBranches(selected);
  if (branches.length > 0) {
    addBranches(nodes, edges, "hero", "right", heroX + HERO_W, branches, getChildBranches, edgeStyle, 0);
  } else {
    const noChildX = heroX + HERO_W + COL_GAP;
    nodes.push({
      id: "no-children",
      type: "noChildren",
      position: { x: noChildX, y: -25 },
      data: {},
    });
    edges.push({
      id: "e-hero-nochild",
      source: "hero", sourceHandle: "right",
      target: "no-children", targetHandle: "left",
      type: "smoothstep", style: edgeStyle,
    });
  }

  return { nodes, edges };
}

function addBranches(
  nodes: Node[],
  edges: Edge[],
  sourceId: string,
  sourceHandle: string,
  sourceRight: number,
  branches: OptionBranch[],
  getChildBranches: (q: EditableQuestion) => OptionBranch[],
  edgeStyle: Record<string, unknown>,
  depth: number,
) {
  const optionX = sourceRight + COL_GAP;
  const childX = optionX + OPTION_W + COL_GAP;

  // Compute total height
  let totalHeight = 0;
  const branchHeights: number[] = [];
  branches.forEach((br) => {
    const h = Math.max(OPTION_H, br.children.length * CARD_H + (br.children.length - 1) * ROW_GAP);
    branchHeights.push(h);
    totalHeight += h;
  });
  totalHeight += (branches.length - 1) * ROW_GAP * 2;

  let currentY = -totalHeight / 2;

  branches.forEach((branch, bi) => {
    const branchH = branchHeights[bi];
    const branchCenterY = currentY + branchH / 2;

    const optId = `opt-${depth}-${bi}`;
    nodes.push({
      id: optId,
      type: "optionLabel",
      position: { x: optionX, y: branchCenterY - OPTION_H / 2 },
      data: { optionText: branch.optionText },
    });
    edges.push({
      id: `e-${sourceId}-${optId}`,
      source: sourceId, sourceHandle,
      target: optId, targetHandle: "left",
      type: "smoothstep", style: edgeStyle,
    });

    const childrenHeight = branch.children.length * CARD_H + (branch.children.length - 1) * ROW_GAP;
    const childStartY = branchCenterY - childrenHeight / 2;

    branch.children.forEach((child, ci) => {
      const childId = `child-${depth}-${child.id}`;
      const childBranches = depth < MAX_DEPTH ? getChildBranches(child) : [];

      nodes.push({
        id: childId,
        type: "childCard",
        position: { x: childX, y: childStartY + ci * (CARD_H + ROW_GAP) },
        data: { question: child, questionId: child.id, hasChildren: childBranches.length > 0 },
      });
      edges.push({
        id: `e-${optId}-${childId}`,
        source: optId, sourceHandle: "right",
        target: childId, targetHandle: "left",
        type: "smoothstep", style: edgeStyle,
      });

      if (childBranches.length > 0) {
        addBranches(nodes, edges, childId, "right", childX + CARD_W, childBranches, getChildBranches, edgeStyle, depth + 1);
      }
    });

    currentY += branchH + ROW_GAP * 2;
  });
}

// ═══════ MAIN COMPONENT ═══════

export default function LogicFlowView({
  questions,
  selectedQuestion,
  onSelectQuestion,
  characteristicMap,
}: LogicFlowViewProps) {
  // Build a question lookup map
  const questionMap = useMemo(() => {
    const m = new Map<number, EditableQuestion>();
    questions.forEach((q) => m.set(q.id, q));
    return m;
  }, [questions]);

  const getParents = useCallback((q: EditableQuestion): ParentInfo[] => {
    if (!q.enableWhen) return [];
    const parentMap = new Map<number, ParentInfo>();
    q.enableWhen.conditions.forEach((cond) => {
      const src = characteristicMap.get(cond.characteristic);
      if (!src) return;
      const parentQ = questions.find((pq) => pq.questionId === src.questionId);
      if (!parentQ) return;
      if (!parentMap.has(parentQ.id)) {
        parentMap.set(parentQ.id, { question: parentQ, conditions: [], logic: q.enableWhen!.logic });
      }
      parentMap.get(parentQ.id)!.conditions.push({ optionText: src.optionText, operator: cond.operator, value: cond.value });
    });
    return Array.from(parentMap.values());
  }, [characteristicMap, questions]);

  const getChildBranches = useCallback((q: EditableQuestion): OptionBranch[] => {
    if (!q.characteristic) return [];
    const chars = parseCharacteristics(q.characteristic);
    if (chars.length === 0) return [];
    const opts = q.answerOptions?.split("|").map((o) => o.trim()) || [];
    const branchMap = new Map<string, EditableQuestion[]>();
    questions.forEach((cq) => {
      if (cq.id === q.id || !cq.enableWhen) return;
      cq.enableWhen.conditions.forEach((cond) => {
        const idx = chars.indexOf(cond.characteristic);
        if (idx === -1) return;
        const optText = opts[idx] || cond.characteristic;
        if (!branchMap.has(optText)) branchMap.set(optText, []);
        const list = branchMap.get(optText)!;
        if (!list.find((x) => x.id === cq.id)) list.push(cq);
      });
    });
    return Array.from(branchMap.entries()).map(([optionText, children]) => ({ optionText, children }));
  }, [questions]);

  const { nodes, edges } = useMemo(() => {
    if (!selectedQuestion) return { nodes: [], edges: [] };
    const parents = getParents(selectedQuestion);
    return buildFlowGraph(selectedQuestion, parents, getChildBranches, questionMap);
  }, [selectedQuestion, getParents, getChildBranches, questionMap]);

  // Handle node clicks — navigate to parent/child questions
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const qId = node.data?.questionId as number | undefined;
    if (qId && node.id !== "hero") {
      const q = questionMap.get(qId);
      if (q) onSelectQuestion(q);
    }
  }, [questionMap, onSelectQuestion]);

  if (!selectedQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 bg-base-100 border-l border-base-300">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-base-content mb-1">Logic Flow</h3>
        <p className="text-sm text-base-content/70 max-w-xs">
          Select a question from the list to visualise its conditional logic and relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-base-100 border-l border-base-300">
      <ReactFlow
        key={selectedQuestion.id}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.4, minZoom: 0.75, maxZoom: 1.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Controls showInteractive={false} />
        <Background gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
