
import React, { useEffect, useMemo, useState } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import "./styles/notes.css";
import Note from "./Note";
import axios from "axios";
import Aos from "aos";
import "aos/dist/aos.css";

axios.defaults.withCredentials = true;

const Notes = ({ notes, setNotes, toast }) => {
  const [noteTitle, setNoteTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Aos.init({ duration: 700 });

    axios
      .get(`${process.env.REACT_APP_API_URL}/note/getNote`)
      .then((res) => {
        setNotes(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Unable to load notes");
      });
  }, [setNotes, toast]);

  const filteredItems = useMemo(() => {
    const safeNotes = Array.isArray(notes) ? notes : [];

    return safeNotes.filter((eachItem) =>
      (eachItem.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
    );
  }, [notes, searchQuery]);

  const addNote = (e) => {
    e.preventDefault();

    const title = noteTitle.trim();

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    const now = new Date();

    const newNote = {
      id: crypto.randomUUID(),
      noteText: "",
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString(),
      title,
    };

    setNotes((current) => [...current, newNote]);
    setNoteTitle("");

    toast.success("Note created. Save it using the save icon.");
  };

  const safeNotes = Array.isArray(notes) ? notes : [];

  return (
    <div className="notes-page" data-aos="fade-up">

      {/* PAGE HEADING */}
      <div className="notes-page-heading">
        <div>
          <span className="notes-eyebrow">YOUR PERSONAL SPACE</span>
          <h1>My Notes</h1>
          <p>Capture ideas, thoughts and important information.</p>
        </div>

        <div className="notes-total">
          <strong>{safeNotes.length}</strong>
          <span>Notes saved</span>
        </div>
      </div>

      {/* SEARCH */}
      <div className="notes-toolbar">
        <div className="notes-search">
          <BiSearchAlt2 size={21} />

          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            placeholder="Search your notes..."
          />
        </div>

        {/* ADD NOTE */}
        <form className="notes-add-form" onSubmit={addNote}>
          <input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            type="text"
            className="notes-title-input"
            placeholder="Enter a note title..."
            maxLength={100}
          />

          <button type="submit" className="notes-add-button">
            + New Note
          </button>
        </form>
      </div>

      {/* NOTES HEADING */}
      <div className="notes-list-heading">
        <div>
          <h2>Your notes</h2>
          <p>All your saved thoughts in one place.</p>
        </div>

        <span>{filteredItems.length} results</span>
      </div>

      {/* NOTES GRID */}
      <div className="notes-div">

        {filteredItems.length === 0 ? (
          <div className="notes-empty-state">
            <div className="notes-empty-icon">
              <span>✎</span>
            </div>

            <h3>
              {searchQuery ? "No matching notes" : "No notes yet"}
            </h3>

            <p>
              {searchQuery
                ? "Try another search term."
                : "Create your first note to capture your ideas and thoughts."}
            </p>
          </div>
        ) : (
          filteredItems.map((note) => (
            <Note
              key={note.id}
              val={note}
              notes={safeNotes}
              setNotes={setNotes}
              toast={toast}
            />
          ))
        )}

      </div>
    </div>
  );
};

export default Notes;
