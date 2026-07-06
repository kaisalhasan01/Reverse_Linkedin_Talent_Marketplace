/**
 * Demo data: 12 candidates (mixed LOOKING/EMPLOYED), 2 companies, a social
 * graph with posts/likes/comments, and a company→candidate outreach thread
 * with a structured job offer.
 *
 * Every account signs in with the password below.
 * Handy logins:  anna@demo.se (candidate) · talent@acme.se (company)
 */
import { PrismaClient, Role, WorkStatus, ConnectionStatus, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Passw0rd!";

type CandidateSeed = {
  email: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  skills: string[];
  status: WorkStatus;
  experiences?: { title: string; company: string; startDate: string; endDate?: string; description?: string }[];
  educations?: { school: string; degree: string; field: string; startYear: number; endYear?: number }[];
  projects?: { name: string; description: string; url?: string }[];
  certifications?: { name: string; issuer: string; year: number }[];
};

const candidates: CandidateSeed[] = [
  {
    email: "anna@demo.se",
    name: "Anna Lindqvist",
    headline: "Fullstack Developer — React, Node.js & Postgres",
    bio: "Fullstack developer with 5 years building SaaS products. I care about clean data models, fast UIs and boring, reliable infrastructure. Looking for a product-focused team.",
    location: "Stockholm",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Next.js", "AWS"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Fullstack Developer", company: "Klarna", startDate: "2022-03-01", description: "Checkout team. React/Node, event-driven services, 40+ deploys a week." },
      { title: "Frontend Developer", company: "Tink", startDate: "2020-01-15", endDate: "2022-02-28", description: "Built the account aggregation dashboard in React + TypeScript." },
    ],
    educations: [{ school: "KTH Royal Institute of Technology", degree: "MSc", field: "Computer Science", startYear: 2015, endYear: 2020 }],
    projects: [{ name: "OpenBudget", description: "Open-source budgeting app with 2k GitHub stars.", url: "https://github.com/example/openbudget" }],
    certifications: [{ name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", year: 2023 }],
  },
  {
    email: "erik@demo.se",
    name: "Erik Johansson",
    headline: "Machine Learning Engineer — NLP & recommendation systems",
    bio: "ML engineer shipping models to production, not just notebooks. Python, PyTorch, MLOps on Kubernetes. Ex-Spotify.",
    location: "Göteborg",
    skills: ["Python", "PyTorch", "Machine Learning", "Kubernetes", "SQL"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "ML Engineer", company: "Spotify", startDate: "2021-06-01", description: "Podcast recommendations. Ranking models serving 100M+ users." },
    ],
    educations: [{ school: "Chalmers University of Technology", degree: "MSc", field: "Data Science and AI", startYear: 2016, endYear: 2021 }],
  },
  {
    email: "sara@demo.se",
    name: "Sara Nilsson",
    headline: "Senior UX Designer — design systems & research",
    bio: "Designer who prototypes in code. I run research, build design systems and work tightly with engineers. Figma black belt.",
    location: "Stockholm",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "HTML/CSS"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Senior UX Designer", company: "SEB", startDate: "2020-09-01", description: "Led the design system used by 14 product teams." },
    ],
    educations: [{ school: "Umeå Institute of Design", degree: "MFA", field: "Interaction Design", startYear: 2014, endYear: 2016 }],
  },
  {
    email: "johan@demo.se",
    name: "Johan Berg",
    headline: "DevOps / Platform Engineer — Kubernetes, Terraform, CI/CD",
    bio: "I build platforms other developers love to deploy on. GitOps, observability, cost optimisation. On-call veteran.",
    location: "Malmö",
    skills: ["Kubernetes", "Terraform", "AWS", "Go", "CI/CD", "Prometheus"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Platform Engineer", company: "IKEA", startDate: "2019-04-01", description: "Internal developer platform for 300+ engineers." },
    ],
    educations: [{ school: "Lund University", degree: "BSc", field: "Computer Science", startYear: 2013, endYear: 2016 }],
    certifications: [{ name: "CKA: Certified Kubernetes Administrator", issuer: "CNCF", year: 2022 }],
  },
  {
    email: "maria@demo.se",
    name: "Maria Ek",
    headline: "Embedded Systems Engineer — C/C++, RTOS, automotive",
    bio: "Embedded engineer from the automotive world. AUTOSAR, functional safety (ISO 26262), and a soft spot for Rust.",
    location: "Linköping",
    skills: ["C++", "C", "Rust", "RTOS", "AUTOSAR", "CAN"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Embedded Software Engineer", company: "Veoneer", startDate: "2018-08-01", description: "Radar signal processing units for ADAS." },
    ],
    educations: [{ school: "Linköping University", degree: "MSc", field: "Applied Physics and Electrical Engineering", startYear: 2012, endYear: 2017 }],
  },
  {
    email: "oskar@demo.se",
    name: "Oskar Holm",
    headline: "Backend Engineer — Java, Spring, event-driven systems",
    bio: "Backend engineer specialised in high-throughput payment systems. Kafka enthusiast. I write tests first and mean it.",
    location: "Stockholm",
    skills: ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Docker"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Backend Engineer", company: "Swish", startDate: "2020-02-01", description: "Real-time payment rails, 5k TPS peak." },
    ],
    educations: [{ school: "KTH Royal Institute of Technology", degree: "MSc", field: "Software Engineering", startYear: 2014, endYear: 2019 }],
  },
  {
    email: "elin@demo.se",
    name: "Elin Wallin",
    headline: "Data Engineer — dbt, Snowflake, Airflow",
    bio: "I turn data swamps into data platforms. Analytics engineering with dbt, orchestration with Airflow, and stakeholder therapy.",
    location: "Uppsala",
    skills: ["Python", "dbt", "Snowflake", "Airflow", "SQL", "Spark"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Data Engineer", company: "ICA", startDate: "2021-01-01", description: "Built the retail analytics platform: 200+ dbt models." },
    ],
    educations: [{ school: "Uppsala University", degree: "MSc", field: "Data Science", startYear: 2015, endYear: 2020 }],
  },
  {
    email: "david@demo.se",
    name: "David Sjöberg",
    headline: "iOS Developer — Swift, SwiftUI",
    bio: "iOS developer since Objective-C days. SwiftUI convert. I obsess over 120fps scrolling and crash-free sessions.",
    location: "Göteborg",
    skills: ["Swift", "SwiftUI", "iOS", "Combine", "Xcode"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "iOS Developer", company: "Volvo Cars", startDate: "2019-10-01", description: "Volvo Cars companion app, 4.7★ on the App Store." },
    ],
    educations: [{ school: "Chalmers University of Technology", degree: "BSc", field: "Software Engineering", startYear: 2015, endYear: 2018 }],
  },
  {
    email: "lisa@demo.se",
    name: "Lisa Öberg",
    headline: "Engineering Manager — grown from senior backend",
    bio: "EM for two teams (11 engineers). I still read every RFC and occasionally sneak in a PR. Servant leadership, real roadmaps.",
    location: "Stockholm",
    skills: ["Leadership", "Agile", "System Design", "Java", "Hiring"],
    status: WorkStatus.EMPLOYED,
    experiences: [
      { title: "Engineering Manager", company: "Ericsson", startDate: "2021-05-01", description: "Two platform teams: build systems and internal tooling." },
    ],
  },
  {
    email: "karl@demo.se",
    name: "Karl Axelsson",
    headline: "Security Engineer — appsec & cloud security",
    bio: "AppSec engineer: threat modelling, SAST/DAST pipelines, and teaching devs to love security reviews. OSCP.",
    location: "Remote (Sweden)",
    skills: ["Security", "Penetration Testing", "AWS", "Python", "Threat Modelling"],
    status: WorkStatus.EMPLOYED,
    certifications: [{ name: "OSCP", issuer: "Offensive Security", year: 2021 }],
  },
  {
    email: "amina@demo.se",
    name: "Amina Hassan",
    headline: "Frontend Engineer — React, accessibility, performance",
    bio: "Frontend engineer who ships accessible, fast interfaces. WCAG 2.2 nerd. Core Web Vitals are my love language.",
    location: "Malmö",
    skills: ["React", "TypeScript", "Accessibility", "Next.js", "CSS"],
    status: WorkStatus.LOOKING,
    experiences: [
      { title: "Frontend Engineer", company: "Trustly", startDate: "2022-01-01", description: "Payment UI SDK embedded on 8k+ merchant sites." },
    ],
    educations: [{ school: "Malmö University", degree: "BSc", field: "Interaction Design", startYear: 2016, endYear: 2019 }],
  },
  {
    email: "gustav@demo.se",
    name: "Gustav Lund",
    headline: "Game Developer — Unity, C#, multiplayer",
    bio: "Gameplay programmer. Shipped two titles on Steam. Netcode, ECS and the dark arts of frame budgets.",
    location: "Skövde",
    skills: ["Unity", "C#", "Multiplayer", "Shaders", "Game Design"],
    status: WorkStatus.EMPLOYED,
    experiences: [
      { title: "Gameplay Programmer", company: "Coffee Stain Studios", startDate: "2020-06-01", description: "Gameplay systems on a co-op factory builder." },
    ],
  },
];

async function main() {
  console.log("Seeding…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Wipe in FK-safe order (idempotent reseeds during dev)
  await prisma.jobOffer.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.project.deleteMany();
  await prisma.education.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Candidates
  const users: Record<string, string> = {}; // email -> userId
  for (const c of candidates) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        passwordHash,
        role: Role.CANDIDATE,
        candidateProfile: {
          create: {
            headline: c.headline,
            bio: c.bio,
            location: c.location,
            skills: c.skills,
            status: c.status,
            experiences: {
              create: (c.experiences ?? []).map((e) => ({
                title: e.title,
                company: e.company,
                startDate: new Date(e.startDate),
                endDate: e.endDate ? new Date(e.endDate) : null,
                description: e.description ?? "",
              })),
            },
            educations: { create: c.educations ?? [] },
            projects: { create: c.projects ?? [] },
            certifications: { create: c.certifications ?? [] },
          },
        },
      },
    });
    users[c.email] = user.id;
  }

  // Companies
  const acmeOwner = await prisma.user.create({
    data: {
      email: "talent@acme.se",
      name: "Acme Talent Team",
      passwordHash,
      role: Role.COMPANY,
      company: {
        create: {
          name: "Acme Technologies AB",
          website: "https://acme.example",
          about: "Product company building logistics software for the Nordics. 120 people, Stockholm HQ.",
          subscriptionStatus: SubscriptionStatus.TRIALING,
          seats: 2,
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      email: "hr@nordicsoft.se",
      name: "NordicSoft Recruiting",
      passwordHash,
      role: Role.COMPANY,
      company: {
        create: {
          name: "Nordic Software AB",
          website: "https://nordicsoft.example",
          about: "Consultancy with 40 engineers across Sweden. Remote-friendly.",
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          seats: 5,
        },
      },
    },
  });

  // Social graph: connections around Anna + a few others
  const conn = (a: string, b: string, status: ConnectionStatus) =>
    prisma.connection.create({ data: { requesterId: users[a], addresseeId: users[b], status } });
  await conn("anna@demo.se", "erik@demo.se", ConnectionStatus.ACCEPTED);
  await conn("sara@demo.se", "anna@demo.se", ConnectionStatus.ACCEPTED);
  await conn("anna@demo.se", "lisa@demo.se", ConnectionStatus.ACCEPTED);
  await conn("johan@demo.se", "anna@demo.se", ConnectionStatus.PENDING); // incoming request for Anna
  await conn("oskar@demo.se", "anna@demo.se", ConnectionStatus.PENDING); // incoming request for Anna
  await conn("erik@demo.se", "sara@demo.se", ConnectionStatus.ACCEPTED);
  await conn("elin@demo.se", "oskar@demo.se", ConnectionStatus.ACCEPTED);
  await conn("amina@demo.se", "sara@demo.se", ConnectionStatus.ACCEPTED);

  // Posts, likes, comments
  const post = (email: string, content: string, daysAgo: number) =>
    prisma.post.create({
      data: {
        authorId: users[email],
        content,
        createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000),
      },
    });
  const p1 = await post("anna@demo.se", "After 5 great years I'm exploring what's next! Looking for a fullstack role in a product team that ships often. My DMs are open — or just hit \"Looking for work\" search if you're a company here. 🚀", 1);
  const p2 = await post("erik@demo.se", "Hot take: most companies don't need a fancy ML platform. They need one boring model in production with good monitoring. Fight me.", 2);
  const p3 = await post("sara@demo.se", "Shipped our design system v3 today. 14 teams, one source of truth. The secret? We deleted more components than we added.", 3);
  const p4 = await post("johan@demo.se", "Cut our AWS bill by 38% this quarter. Thread: it was mostly deleting unused NAT gateways and right-sizing one Kafka cluster. Glamorous work.", 4);
  const p5 = await post("amina@demo.se", "Reminder: if your form can't be completed with a keyboard, it's broken. Accessibility isn't a feature, it's table stakes.", 5);
  const p6 = await post("lisa@demo.se", "We're not hiring right now, but I still take 2 coffee chats a week with engineers early in their careers. Happy to share how we interview.", 6);

  const like = (email: string, postId: string) => prisma.like.create({ data: { userId: users[email], postId } });
  await like("erik@demo.se", p1.id);
  await like("sara@demo.se", p1.id);
  await like("lisa@demo.se", p1.id);
  await like("amina@demo.se", p1.id);
  await like("anna@demo.se", p2.id);
  await like("elin@demo.se", p2.id);
  await like("anna@demo.se", p3.id);
  await like("erik@demo.se", p4.id);
  await like("sara@demo.se", p5.id);
  await like("anna@demo.se", p6.id);

  const comment = (email: string, postId: string, content: string) =>
    prisma.comment.create({ data: { authorId: users[email], postId, content } });
  await comment("lisa@demo.se", p1.id, "Any team would be lucky to have you, Anna!");
  await comment("erik@demo.se", p1.id, "Can confirm — best code reviewer I've worked with.");
  await comment("anna@demo.se", p2.id, "Strongly agree. Monitoring > architecture diagrams.");
  await comment("elin@demo.se", p4.id, "The unused NAT gateway strikes again 😂");

  // Company outreach: Acme → Anna, with a structured offer
  const convo = await prisma.conversation.create({
    data: {
      participants: { create: [{ userId: acmeOwner.id }, { userId: users["anna@demo.se"] }] },
    },
  });
  const offerMsg = await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: acmeOwner.id,
      body: "Hi Anna! I lead talent at Acme Technologies. Your profile is exactly what our checkout platform team is missing — modern fullstack with real Postgres depth. Here's a concrete offer to start the conversation; happy to adjust.",
      createdAt: new Date(Date.now() - 6 * 3600 * 1000),
    },
  });
  await prisma.jobOffer.create({
    data: {
      messageId: offerMsg.id,
      title: "Senior Fullstack Engineer — Checkout Platform",
      salaryMin: 62000,
      salaryMax: 72000,
      currency: "SEK",
      hoursPerWeek: 40,
      location: "Stockholm (hybrid, 2 days office)",
    },
  });
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: users["anna@demo.se"],
      body: "Hi! Thanks for the concrete numbers — refreshing. I'd love to hear more about the team setup. Could we do a call this week?",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
  });

  // Candidate ↔ candidate DM
  const dm = await prisma.conversation.create({
    data: { participants: { create: [{ userId: users["anna@demo.se"] }, { userId: users["erik@demo.se"] }] } },
  });
  await prisma.message.create({
    data: { conversationId: dm.id, senderId: users["erik@demo.se"], body: "Saw your post — happy to intro you to a couple of teams at Spotify if you want!", createdAt: new Date(Date.now() - 26 * 3600 * 1000) },
  });
  await prisma.message.create({
    data: { conversationId: dm.id, senderId: users["anna@demo.se"], body: "That would be amazing, thanks Erik! 🙏", createdAt: new Date(Date.now() - 25 * 3600 * 1000) },
  });

  const counts = {
    users: await prisma.user.count(),
    profiles: await prisma.candidateProfile.count(),
    companies: await prisma.company.count(),
    posts: await prisma.post.count(),
    connections: await prisma.connection.count(),
    messages: await prisma.message.count(),
    offers: await prisma.jobOffer.count(),
  };
  console.log("Seeded:", counts);
  console.log(`\nDemo logins (password: ${PASSWORD})`);
  console.log("  Candidate: anna@demo.se");
  console.log("  Company:   talent@acme.se");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
