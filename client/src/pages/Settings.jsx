import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import api from "../services/api";
import toast from "react-hot-toast";

const PLAYING_STYLES = ["", "Aggressive", "Analytical", "Emotional", "Logical", "Creative"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Hindi", "Portuguese", "Arabic", "Mandarin"];

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: "1.2rem" }}>
    <label style={{
      display: "block", fontFamily: "Cinzel,serif", fontSize: "0.65rem",
      color: "#8a8070", letterSpacing: "0.12em", marginBottom: "0.5rem",
    }}>{label}</label>
    {children}
    {hint && <p style={{ color: "#4a4540", fontSize: "0.68rem", marginTop: "0.35rem", fontFamily: "Inter,sans-serif" }}>{hint}</p>}
  </div>
);

const inputStyle = {
  width: "100%", padding: "0.8rem 1rem", background: "#0d0d0d",
  border: "1px solid #2a2a2a", borderRadius: 8, color: "#f5f0e8",
  fontFamily: "Inter,sans-serif", fontSize: "0.85rem", outline: "none",
};

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: "", bio: "", country: "", state: "", district: "", playingStyle: "", languages: [],
  });
  const [saving, setSaving] = useState(false);

  // Prefill from the currently logged-in user (already in Redux — no extra fetch needed)
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        country: user.country || "",
        state: user.state || "",
        district: user.district || "",
        playingStyle: user.playingStyle || "",
        languages: user.languages?.length ? user.languages : ["English"],
      });
    }
  }, [user]);

  const toggleLanguage = (lang) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!form.languages.length) {
      toast.error("Select at least one language");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/users/profile/update", {
        name: form.name.trim(),
        bio: form.bio.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        district: form.district.trim(),
        playingStyle: form.playingStyle,
        languages: form.languages,
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
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "2rem 1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: 520, margin: "0 auto", background: "#111",
          border: "1px solid #2a2a2a", borderRadius: 16, padding: "2rem",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
          background: "linear-gradient(90deg,transparent,#c9a84c,transparent)",
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
          <h1 style={{ fontFamily: "Cinzel,serif", fontSize: "1.2rem", color: "#f5f0e8", fontWeight: 700 }}>
            Edit Profile
          </h1>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent", border: "1px solid #2a2a2a", color: "#8a8070",
              padding: "0.35rem 0.9rem", borderRadius: 6, fontFamily: "Cinzel,serif",
              fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer",
            }}
          >← BACK</button>
        </div>

        <Field label="NAME">
          <input style={inputStyle} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={50} placeholder="Your display name" />
        </Field>

        <Field label="BIO" hint={`${form.bio.length}/200`}>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "Inter,sans-serif" }}
            value={form.bio} maxLength={200}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell the arena about yourself" />
        </Field>

        <Field label="COUNTRY">
          <input style={inputStyle} value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="e.g. India" />
        </Field>

        <div style={{ display: "flex", gap: "0.7rem" }}>
          <div style={{ flex: 1 }}>
            <Field label="STATE / PROVINCE">
              <input style={inputStyle} value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="Optional" />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="DISTRICT / CITY">
              <input style={inputStyle} value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="Optional" />
            </Field>
          </div>
        </div>

        <Field label="DEBATE STYLE">
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.playingStyle}
            onChange={(e) => setForm({ ...form, playingStyle: e.target.value })}
          >
            {PLAYING_STYLES.map((s) => (
              <option key={s} value={s}>{s || "Not set"}</option>
            ))}
          </select>
        </Field>

        <Field label="LANGUAGES" hint="Select at least one">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {LANGUAGE_OPTIONS.map((lang) => {
              const active = form.languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  style={{
                    padding: "0.35rem 0.9rem", borderRadius: 20,
                    border: active ? "1px solid #c9a84c" : "1px solid #2a2a2a",
                    background: active ? "#c9a84c15" : "transparent",
                    color: active ? "#c9a84c" : "#8a8070",
                    fontFamily: "Inter,sans-serif", fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >{lang}</button>
              );
            })}
          </div>
        </Field>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 25px #c9a84c20" }} whileTap={{ scale: 0.98 }}
          onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "0.9rem", marginTop: "0.5rem",
            background: saving ? "#5a4a20" : "linear-gradient(135deg,#c9a84c,#a07830)",
            border: "none", borderRadius: 8, color: "#0a0a0a",
            fontFamily: "Cinzel,serif", fontSize: "0.82rem", letterSpacing: "0.15em",
            cursor: saving ? "not-allowed" : "pointer", fontWeight: 700,
          }}
        >{saving ? "SAVING..." : "SAVE CHANGES"}</motion.button>
      </motion.div>
    </div>
  );
};

export default Settings;