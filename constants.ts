import { TreeNode, SandboxFile, AppSettings } from './types';

export const STORAGE_KEY_FILES = 'nary_sandbox_files_v2';
export const STORAGE_KEY_ACTIVE_ID = 'nary_sandbox_active_file_id_v2';
export const STORAGE_KEY_WORKSPACE = 'nary_sandbox_workspace_name_v2';
export const STORAGE_KEY_VIEWMODE = 'nary_sandbox_view_mode_v2';
export const STORAGE_KEY_SETTINGS = 'nary_sandbox_app_settings_v2';
export const STORAGE_KEY_TRANSFORM = 'nary_sandbox_graph_transform_v2';

export const SAMPLE_ELI_CAELUS_NODES: TreeNode[] = [
  {
    id: 1,
    type: "user",
    content: "what do you think of eli as a friend and as a boyfriend",
    thought: null,
    children: [
      {
        id: 2,
        type: "assistant",
        content: "Eli is profoundly loyal and grounded as a friend, but can harbor unspoken vulnerabilities. As a partner, his affection runs deep and protective, though his fear of being abandoned makes him vulnerable to sudden emotional withdrawals or overreactions.",
        thought: "Analyzing character archetype: protective, loyal, sensitive beneath stoic exterior.",
        children: [
          {
            id: 3,
            type: "user",
            content: "what do you think of caelus as a character?",
            thought: null,
            children: [
              {
                id: 4,
                type: "assistant",
                content: "Caelus is driven and charismatic, yet prone to masking his struggles with an 'I'm always fine' attitude that inadvertently alienates those closest to him.",
                thought: "Comparing relationship dynamics and communication friction.",
                children: [
                  {
                    id: 5,
                    type: "user",
                    content: "if eli were still angry when caelus came back, do you think it would've been justified?",
                    thought: null,
                    children: [
                      {
                        id: 6,
                        type: "assistant",
                        content: "Entirely justified. When someone says *'you're always fine'* and vanishes, it dismisses the genuine agony and sleepless worry of the person left waiting.",
                        thought: "Evaluating emotional validation and attachment friction.",
                        children: [
                          {
                            id: 7,
                            type: "user",
                            content: "write an alternative scenario. where caelus comes back, but instead of the caretaker taking over, eli has an emotional meltdown because he was really hurt from what caelus said \"you're always fine\" and he's been worried sick",
                            thought: null,
                            children: [
                              {
                                id: 8,
                                type: "assistant",
                                content: "Eli stared at the doorway, keys slipping from trembling fingers. *'You're always fine,'* he repeated, voice cracking into a ragged sob. *'You told me that and then you vanished for three weeks. Do you have any idea how much I hated myself for believing you?'*",
                                thought: "Scenario A: Immediate vocal confrontation, focus on the painful lingering impact of the dismissed phrase.",
                                children: []
                              }
                            ]
                          },
                          {
                            id: 9,
                            type: "user",
                            content: "write an alternative scenario. where caelus comes back, but instead of the caretaker taking over, eli has an emotional meltdown because he was really hurt from what caelus said \"you're always fine\" and he's been worried sick and now caelus was like this and eli wants to make it better but he's still mad. (when eli has the meltdown, it's less anger and more very sad, very hurt crying while trying to seem angry)",
                            thought: null,
                            children: [
                              {
                                id: 10,
                                type: "assistant",
                                content: "Eli clenched his fists, trying to scowl, but tears immediately spilled down his flushed cheeks. *'Don't touch me,'* he whispered, choking on his breath as he simultaneously reached out to steady Caelus's trembling shoulder. *'I want to be furious with you, but you look like you're shattering, and I don't know what to do with myself.'*",
                                thought: "Scenario B: Complex emotional ambivalence—trying to look furious while weeping out of sheer relief and heartbroken care.",
                                children: []
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_PRESET_FILES: SandboxFile[] = [
  {
    id: 'sample-eli-caelus-v1',
    originalFilename: 'eli_caelus_dialogue_v1.json',
    filePath: 'Storylines/eli_caelus_dialogue_v1.json',
    rootNodes: SAMPLE_ELI_CAELUS_NODES,
    rawJsonString: JSON.stringify(SAMPLE_ELI_CAELUS_NODES, null, 2),
    nodeCount: 10,
    maxDepth: 7,
    branchCount: 2,
    metadata: {
      aliasName: 'Eli & Caelus Drama Branch (Draft A)',
      category: 'Creative Writing',
      folder: 'Storylines',
      tags: ['Storyline', 'Emotional Meltdown', 'Branching Paths'],
      notes: 'Key exploration of Caelus returning and Eli breaking down. Two divergent paths at turn 7 vs 9.',
      nodeAnnotations: {
        7: 'Branch A: Anger-focused heartbreak',
        9: 'Branch B: Vulnerable, crying-while-trying-to-stay-mad'
      },
      starredBranches: ['path-leaf-8'],
      branchMeta: {
        'path-leaf-8': {
          customName: 'Scenario A: Vocal Anger Meltdown',
          tags: ['Anger', 'Confrontation', 'Key Plot'],
          notes: 'Focuses on the lasting sting of the "you\'re always fine" brush-off.'
        },
        'path-leaf-10': {
          customName: 'Scenario B: Weeping & Care Meltdown',
          tags: ['Tears', 'Vulnerable', 'Relief'],
          notes: 'Eli tries to stay mad but instantly breaks down in heartbroken concern.'
        }
      }
    }
  },
  {
    id: 'sample-ai-assistant-audit',
    originalFilename: 'tech_support_multibranch.json',
    filePath: 'Technical Support/tech_support_multibranch.json',
    rootNodes: [
      {
        id: 101,
        type: 'user',
        content: 'I need to design a high-throughput queue system in Go.',
        thought: null,
        children: [
          {
            id: 102,
            type: 'assistant',
            content: 'Do you prefer an in-memory lock-free ring buffer or an external distributed broker like NATS JetStream or Kafka?',
            thought: 'Determine scale and persistence requirements.',
            children: [
              {
                id: 103,
                type: 'user',
                content: 'In-memory single machine, maximum performance sub-millisecond.',
                thought: null,
                children: [
                  {
                    id: 104,
                    type: 'assistant',
                    content: 'A lock-free ring buffer using atomic CAS pointers or LMAX Disruptor pattern in Go is ideal.',
                    thought: 'Provide LMAX architecture outline.',
                    children: []
                  }
                ]
              },
              {
                id: 105,
                type: 'user',
                content: 'Distributed with disk persistence and replay.',
                thought: null,
                children: [
                  {
                    id: 106,
                    type: 'assistant',
                    content: 'NATS JetStream provides lightweight clustering and raft-based log persistence with minimal overhead.',
                    thought: 'Provide NATS config and consumer group example.',
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    rawJsonString: '',
    nodeCount: 6,
    maxDepth: 3,
    branchCount: 2,
    metadata: {
      aliasName: 'Go Message Queue Architecture Tree',
      category: 'Technical Design',
      folder: 'Technical Support',
      tags: ['Go', 'Architecture', 'Benchmarking'],
      notes: 'Contains split paths for in-memory ringbuffer vs distributed NATS JetStream.',
      nodeAnnotations: {},
      starredBranches: ['path-leaf-104'],
      branchMeta: {
        'path-leaf-104': {
          customName: 'LMAX Lock-free Ring Buffer',
          tags: ['In-Memory', 'CAS', 'Sub-ms'],
          notes: 'Single node, lock-free ring buffer pattern.'
        }
      }
    }
  }
];

export const CATEGORIES_PRESET = [
  'All',
  'Creative Writing',
  'Technical Design',
  'Roleplay & Personas',
  'Uncategorized'
];

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'medium',
  showThoughts: true,
  globalTags: ['Storyline', 'Emotional Meltdown', 'Architecture', 'Benchmarking', 'Key Plot', 'Draft']
};
