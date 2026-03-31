import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SessionKind } from "@prisma/client";

type SeededUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isAi?: boolean;
};

type SeededMessage = {
  sender: "owner" | "peer";
  minutesAgo: number;
  content: string;
  sharedLinks?: {
    url: string;
    title?: string;
    description?: string;
    accent?: string;
  }[];
  sharedDocs?: {
    name: string;
    meta: string;
    tone?: string;
    short?: string;
  }[];
  sharedMedia?: {
    month: string;
    tone: string;
  }[];
};

type SeededConversation = {
  user: SeededUser;
  kind?: SessionKind;
  isMuted?: boolean;
  readState?: "read" | "unread";
  messages: SeededMessage[];
};

function buildAssetCreates(message: SeededMessage) {
  return [
    ...(message.sharedLinks?.map((item) => ({
      kind: "link" as const,
      url: item.url,
      title: item.title,
      description: item.description,
      accent: item.accent,
    })) ?? []),
    ...(message.sharedDocs?.map((item) => ({
      kind: "doc" as const,
      name: item.name,
      meta: item.meta,
      short: item.short,
      tone: item.tone,
    })) ?? []),
    ...(message.sharedMedia?.map((item) => ({
      kind: "media" as const,
      month: item.month,
      tone: item.tone,
    })) ?? []),
  ];
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

function getDirectKey(userAId: string, userBId: string) {
  return [userAId, userBId].sort().join("::");
}

function isoMinutesAgo(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60 * 1000);
}

const seededConversations: SeededConversation[] = [
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e01",
      name: "Daniel CH",
      email: "dnielch@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=12",
    },
    readState: "read",
    messages: [
      {
        sender: "peer",
        minutesAgo: 144,
        content: "Hey, Dan",
      },
      {
        sender: "peer",
        minutesAgo: 140,
        content: "Can you help with the last task for Eventora, please?",
      },
      {
        sender: "peer",
        minutesAgo: 136,
        content: "I'm little bit confused with the task.. 🙂",
        sharedLinks: [
          {
            url: "https://basecamp.net/",
            title: "https://basecamp.net/",
            description:
              "Discover thousands of premium UI kits, templates, and design resources.",
            accent: "bg-slate-900 text-white",
          },
          {
            url: "https://notion.com/",
            title: "https://notion.com/",
            description:
              "A new tool that blends your everyday work apps into one.",
            accent: "bg-white text-black border border-slate-200",
          },
          {
            url: "https://asana.com/",
            title: "https://asana.com/",
            description:
              "Work anytime, anywhere with focused project and workflow tracking.",
            accent: "bg-rose-500 text-white",
          },
          {
            url: "https://trello.com/",
            title: "https://trello.com/",
            description:
              "Make the impossible possible with a clean task board for the team.",
            accent: "bg-sky-500 text-white",
          },
        ],
        sharedDocs: [
          {
            name: "Document Requirement.pdf",
            meta: "10 pages • 16 MB • pdf",
            tone: "bg-red-50 text-red-500",
            short: "PDF",
          },
          {
            name: "User Flow.pdf",
            meta: "7 pages • 32 MB • pdf",
            tone: "bg-red-50 text-red-500",
            short: "PDF",
          },
          {
            name: "Existing App.fig",
            meta: "213 MB • fig",
            tone: "bg-violet-50 text-violet-500",
            short: "FIG",
          },
          {
            name: "Product Illustrations.ai",
            meta: "72 MB • ai",
            tone: "bg-orange-50 text-orange-500",
            short: "AI",
          },
        ],
        sharedMedia: [
          { month: "May", tone: "from-fuchsia-500 via-violet-500 to-cyan-300" },
          { month: "May", tone: "from-slate-950 via-cyan-800 to-rose-500" },
          { month: "May", tone: "from-slate-100 via-slate-200 to-slate-300" },
          { month: "May", tone: "from-rose-500 via-red-300 to-slate-700" },
          { month: "May", tone: "from-violet-600 via-fuchsia-500 to-slate-900" },
          { month: "April", tone: "from-cyan-500 via-fuchsia-600 to-orange-500" },
          { month: "April", tone: "from-pink-200 via-sky-200 to-fuchsia-400" },
          { month: "April", tone: "from-cyan-100 via-sky-400 to-slate-100" },
          { month: "March", tone: "from-zinc-200 via-zinc-100 to-white" },
          { month: "March", tone: "from-amber-100 via-blue-100 to-orange-400" },
        ],
      },
      {
        sender: "owner",
        minutesAgo: 18,
        content: "it's done already, no worries!",
      },
      {
        sender: "owner",
        minutesAgo: 1,
        content: "anytime! my pleasure~",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e02",
      name: "Adrian Kurt",
      email: "adrian.kurt@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=14",
    },
    readState: "unread",
    messages: [
      {
        sender: "owner",
        minutesAgo: 9,
        content: "I updated the rollout notes and clarified the handoff.",
      },
      {
        sender: "peer",
        minutesAgo: 3,
        content: "Thanks for the explanation!",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e03",
      name: "Yomi Immanuel",
      email: "yomi@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=20",
    },
    readState: "read",
    messages: [
      {
        sender: "peer",
        minutesAgo: 12,
        content: "Let's do a quick call after lunch, I'll explain the edge cases.",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e04",
      name: "Bianca Nubia",
      email: "bianca@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=32",
    },
    readState: "read",
    messages: [
      {
        sender: "peer",
        minutesAgo: 32,
        content: "anytime! my pleasure~",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e05",
      name: "Zender Lowre",
      email: "zender@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=53",
    },
    readState: "read",
    isMuted: true,
    messages: [
      {
        sender: "peer",
        minutesAgo: 60,
        content: "Okay cool, that make sense 👍",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e06",
      name: "Palmer Dian",
      email: "palmer@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=44",
    },
    readState: "read",
    messages: [
      {
        sender: "peer",
        minutesAgo: 300,
        content: "Thanks, Jonas! That helps 🙂",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e07",
      name: "Yuki Tanaka",
      email: "yuki@shipz.com",
      avatarUrl: "https://i.pravatar.cc/160?img=47",
    },
    readState: "read",
    messages: [
      {
        sender: "peer",
        minutesAgo: 720,
        content: "Have you watch the new season of Damn...",
      },
    ],
  },
  {
    user: {
      id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e08",
      name: "Shipper AI",
      email: "ai@shipchat.local",
      avatarUrl: "https://i.pravatar.cc/160?img=67",
      isAi: true,
    },
    kind: "ai",
    readState: "read",
    messages: [
      {
        sender: "owner",
        minutesAgo: 45,
        content: "Summarize the three blockers from today's thread into action items.",
      },
      {
        sender: "peer",
        minutesAgo: 42,
        content:
          "1. Finalize the drawer asset model. 2. Seed convincing conversation data. 3. Keep the realtime sidebar state aligned with message inserts.",
        sharedDocs: [
          {
            name: "handoff-summary.pdf",
            meta: "4 pages • 3 MB • pdf",
            tone: "bg-red-50 text-red-500",
            short: "PDF",
          },
        ],
      },
    ],
  },
];

async function upsertUser(user: SeededUser) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAi: user.isAi ?? false,
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAi: user.isAi ?? false,
    },
  });
}

async function seedConversation(anchorUserId: string, conversation: SeededConversation) {
  const peer = await upsertUser(conversation.user);
  const directKey = getDirectKey(anchorUserId, peer.id);
  const lastMessage = conversation.messages.at(-1);
  const lastMessageAt = lastMessage
    ? isoMinutesAgo(lastMessage.minutesAgo)
    : new Date();

  const session = await prisma.session.upsert({
    where: { directKey },
    update: {
      kind: conversation.kind ?? "direct",
      updatedAt: lastMessageAt,
    },
    create: {
      kind: conversation.kind ?? "direct",
      directKey,
      updatedAt: lastMessageAt,
    },
  });

  await prisma.sessionParticipant.upsert({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId: anchorUserId,
      },
    },
    update: {
      isArchived: false,
      isMuted: conversation.isMuted ?? false,
      clearedAt: null,
      lastReadAt:
        conversation.readState === "unread"
          ? isoMinutesAgo((lastMessage?.minutesAgo ?? 1) + 5)
          : new Date(),
    },
    create: {
      sessionId: session.id,
      userId: anchorUserId,
      isArchived: false,
      isMuted: conversation.isMuted ?? false,
      clearedAt: null,
      lastReadAt:
        conversation.readState === "unread"
          ? isoMinutesAgo((lastMessage?.minutesAgo ?? 1) + 5)
          : new Date(),
    },
  });

  await prisma.sessionParticipant.upsert({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId: peer.id,
      },
    },
    update: {
      isArchived: false,
      isMuted: false,
      clearedAt: null,
      lastReadAt: new Date(),
    },
    create: {
      sessionId: session.id,
      userId: peer.id,
      isArchived: false,
      isMuted: false,
      clearedAt: null,
      lastReadAt: new Date(),
    },
  });

  await prisma.message.deleteMany({
    where: {
      sessionId: session.id,
    },
  });

  for (const message of conversation.messages) {
    const assetCreates = buildAssetCreates(message);

    await prisma.message.create({
      data: {
        sessionId: session.id,
        senderId: message.sender === "owner" ? anchorUserId : peer.id,
        content: message.content,
        createdAt: isoMinutesAgo(message.minutesAgo),
        isAi: Boolean(conversation.user.isAi && message.sender === "peer"),
        assets:
          assetCreates.length > 0
            ? {
                create: assetCreates,
              }
            : undefined,
      },
    });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      updatedAt: lastMessageAt,
    },
  });
}

async function main() {
  const anchorUser =
    (await prisma.user.findFirst({
      where: { isAi: false },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.user.create({
      data: {
        id: "7d2ca2fc-8ac0-4557-9851-859f5a6d1e99",
        email: "demo.owner@shipchat.local",
        name: "Demo Operator",
        avatarUrl: "https://i.pravatar.cc/160?img=11",
        isAi: false,
      },
    }));

  for (const conversation of seededConversations) {
    await seedConversation(anchorUser.id, conversation);
  }

  const totalSessions = await prisma.session.count({
    where: {
      participants: {
        some: {
          userId: anchorUser.id,
          isArchived: false,
        },
      },
    },
  });

  const totalMessages = await prisma.message.count({
    where: {
      session: {
        participants: {
          some: {
            userId: anchorUser.id,
          },
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        seededFor: {
          id: anchorUser.id,
          email: anchorUser.email,
          name: anchorUser.name,
        },
        sessions: totalSessions,
        messages: totalMessages,
        contacts: seededConversations.length,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
