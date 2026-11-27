
import React, { useEffect, useState, useRef } from "react";
import { BiSolidSave, BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import Dialog from "./SrNoDialog/Dialog";
import axios from "axios";
import Aos from "aos";
import "aos/dist/aos.css";

const Note = (props) => {
  const { val, notes, setNotes, toast } = props;

  const [dialog, setDialog] = useState({
    isLoading: false,
  });

  const [text, setText] = useState(val.noteText);

  const textareaRef = useRef();
  const idRef = useRef();

  axios.defaults.withCredentials = true;

  useEffect(() => {
    Aos.init({ duration: 600 });
  }, []);

  const deleteNote = (id) => {
    setDialog({ isLoading: true });
    idRef.current = id;
  };

  const areYouSure = (yes) => {
    if (yes) {
      axios
        .delete(
          `${process.env.REACT_APP_API_URL}/note/deleteNote/${idRef.current}`
        )
        .catch((err) => console.log(err));

      setNotes(notes.filter((note) => idRef.current !== note.id));
      setDialog({ isLoading: false });

      toast.success("Deleted Successfully");
    } else {
      setDialog({ isLoading: false });
    }
  };

  const saveNote = async (id) => {
    const note = notes.find((obj) => obj.id === id);

    let found;

    await axios
      .get(`${process.env.REACT_APP_API_URL}/note/getNote`)
      .then((res) => {
        found = res.data.find((obj) => obj.id === id);
      })
      .catch((err) => console.log(err));

    if (!found) {
      await axios
        .post(`${process.env.REACT_APP_API_URL}/note/postNote`, note)
        .catch((err) => console.log(err));
    }

    update(id);
  };

  const update = (id) => {
    axios
      .patch(
        `${process.env.REACT_APP_API_URL}/note/updateNote/${id}`,
        { newText: text }
      )
      .then(() => {
        toast.success("Saved Successfully");
      })
      .catch((err) => {
        console.log(err);
        toast.error("Unable to save note");
      });
  };

  const typing = (e) => {
    setText(e.target.value);
  };

  function focusBtn() {
    textareaRef.current.focus();
  }

  return (
    <>
      <div className="note-body" data-aos="fade-up">

        {dialog.isLoading && (
          <Dialog areYouSure={areYouSure} />
        )}

        {/* NOTE TOOLBAR */}

        <div className="note-head">
          <button
            className="note-bt"
            onClick={() => saveNote(val.id)}
            title="Save Note"
            type="button"
          >
            <BiSolidSave color="#ffffff" size={20} />
          </button>

          <button
            className="note-bt"
            onClick={focusBtn}
            title="Edit Note"
            type="button"
          >
            <BiEdit color="#ffffff" size={20} />
          </button>

          <button
            onClick={() => deleteNote(val.id)}
            className="note-bt"
            title="Delete Note"
            type="button"
          >
            <AiFillDelete color="#ffffff" size={20} />
          </button>
        </div>

        {/* NOTE TITLE */}

        <h3 id="note-title">
          {val.title}
        </h3>

        {/* NOTE CONTENT */}

        <textarea
          ref={textareaRef}
          className="note-textarea"
          value={text}
          spellCheck="false"
          onChange={typing}
          onFocus={(event) =>
            event.currentTarget.setSelectionRange(
              event.currentTarget.value.length,
              event.currentTarget.value.length
            )
          }
        />

        {/* NOTE FOOTER */}

        <div className="note-foot">
          <h3 className="date">
            {val.date}
          </h3>

          <h3 className="time">
            {val.time}
          </h3>
        </div>

      </div>
    </>
  );
};

export default Note;
