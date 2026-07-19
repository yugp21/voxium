import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { COLORS } from "../constants/theme";

const PLAYING_STYLES = ["", "Aggressive", "Analytical", "Emotional", "Logical", "Creative"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Hindi", "Portuguese", "Arabic", "Mandarin"];

// Underline-only fields — a document being edited, not a form in a box.
const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: "1.8rem" }}>
    <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.6rem" }}>{label}</label>
    {children}
    {hint && <p style={{ color: COLORS.textFaint, fontSize: "0.68rem", marginTop: "0.4rem", fontFamily: "Inter,sans-serif" }}>{hint}</p>}
  </div>
);

const underlineInput = {
  width: "100%", padding: "0.6rem 0", background: "transparent",
  border: "none", borderBottom: `1px solid ${COLORS.borderStrong}`, color: COLORS.text,
  fontFamily: "Inter,sans-serif", fontSize: "1rem", outline: "none",
};

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ name: "", bio: "", country: "", state: "", district: "", playingStyle: "", languages: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill once the async Redux user becomes available; re-runs only when `user` itself changes, no cascading render risk
      setForm({
        name: user.name || "", bio: user.bio || "", country: user.country || "",
        state: user.state || "", district: user.district || "", playingStyle: user.playingStyle || "",
        languages: user.languages?.length ? user.languages : ["English"],
      });
    }
  }, [user]);

  const toggleLanguage = (lang) => {
    setForm((f) => ({ ...f, languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang] }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name cannot be empty"); return; }
    if (!form.languages.length) { toast.error("Select at least one language"); return; }
    setSaving(true);
    try {
      const res = await api.put("/users/profile/update", {
        name: form.name.trim(), bio: form.bio.trim(), country: form.country.trim(),
        state: form.state.trim(), district: form.district.trim(),
        playingStyle: form.playingStyle, languages: form.languages,
      });
      dispatch(setUser(res.data.data));
      toast.success("Profile updated");
      navigate(`/profile/${user.username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <button data-cursor="hover" onClick={() => navigate(-1)} style={{
          display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none",
          color: COLORS.textFaint, fontFamily: "Inter, sans-serif", fontSize: "0.78rem", cursor: "pointer", marginBottom: "2rem", padding: 0,
        }}><ArrowLeft size={14} /> Back</button>

        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.5rem" }}>EDIT IDENTITY</div>
        <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "2rem", fontWeight: 800, color: COLORS.text, marginBottom: "2.5rem" }}>Settings</h1>

        <Field label="NAME">
          <input style={underlineInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={50} placeholder="Your display name" />
        </Field>

        <Field label="BIO" hint={`${form.bio.length}/200`}>
          <textarea style={{ ...underlineInput, resize: "vertical", minHeight: 60 }} value={form.bio} maxLength={200}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the arena about yourself" />
        </Field>

        <div style={{ display: "flex", gap: "1.5rem" }}>
          <div style={{ flex: 1 }}><Field label="COUNTRY"><input style={underlineInput} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. India" /></Field></div>
          <div style={{ flex: 1 }}><Field label="STATE"><input style={underlineInput} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Optional" /></Field></div>
        </div>

        <Field label="DISTRICT / CITY">
          <input style={underlineInput} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Optional" />
        </Field>

        <Field label="DEBATE STYLE">
          <select style={{ ...underlineInput, cursor: "pointer" }} value={form.playingStyle} onChange={(e) => setForm({ ...form, playingStyle: e.target.value })}>
            {PLAYING_STYLES.map((s) => <option key={s} value={s}>{s || "Not set"}</option>)}
          </select>
        </Field>

        <Field label="LANGUAGES" hint="Select at least one">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.3rem" }}>
            {LANGUAGE_OPTIONS.map((lang) => {
              const active = form.languages.includes(lang);
              return (
                <button key={lang} type="button" data-cursor="hover" onClick={() => toggleLanguage(lang)}
                  style={{
                    padding: "0.35rem 0.9rem", borderRadius: 20,
                    border: active ? `1px solid ${COLORS.accent2}` : `1px solid ${COLORS.border}`,
                    background: active ? `${COLORS.accent2}12` : "transparent",
                    color: active ? COLORS.accent2 : COLORS.textFaint,
                    fontFamily: "Inter,sans-serif", fontSize: "0.75rem", cursor: "pointer",
                  }}
                >{lang}</button>
              );
            })}
          </div>
        </Field>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "0.9rem", marginTop: "1.5rem",
            background: saving ? COLORS.borderStrong : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
            border: "none", borderRadius: 8, color: "#fff",
            fontFamily: "Inter,sans-serif", fontSize: "0.88rem", fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >{saving ? "Saving..." : "Save Changes"}</motion.button>
      </div>
    </div>
  );
};

export default Settings;