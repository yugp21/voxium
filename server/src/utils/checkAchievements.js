const Achievement = require("../models/Achievement");
const ACHIEVEMENTS = require("../config/achievements");
const { notify } = require("./notify");

// Call after any User.stats/tier update that could unlock something
// (currently: after every debate result). Cheap to call often — it
// no-ops for achievements the user already has.
const checkAchievements = async (userId, stats, tier) => {
  const already = await Achievement.find({ userId }).select("title");
  const have = new Set(already.map((a) => a.title));

  const newlyEarned = ACHIEVEMENTS.filter(
    (a) => !have.has(a.title) && a.check(stats, tier)
  );

  for (const a of newlyEarned) {
    await Achievement.create({
      userId,
      title: a.title,
      description: a.description,
      icon: a.icon,
    });
    await notify({
      userId,
      title: "Achievement Unlocked",
      message: `${a.icon} ${a.title} — ${a.description}`,
      type: "achievement",
      link: `/profile`,
      data: { achievementId: a.id },
    });
  }

  return newlyEarned;
};

module.exports = { checkAchievements };