import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import api from '../utils/api';
import type { Annotation, AnnotationTask } from '../types/task';
import { useAppSelector } from '../hooks';
import { selectAuth } from '../store/slices/authSlice';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
}

/**
 * Interactive annotation surface with optional AI-powered pre-label suggestions.
 */
const AnnotationPage = () => {
  const { taskId } = useParams();
  const { user } = useAppSelector(selectAuth);
  const stageRef = useRef<Konva.Stage>(null);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [task, setTask] = useState<AnnotationTask | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [aiLabels, setAiLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.task);
      setImageUrl(data.task.previewUrl || '');
      setBoxes(
        (data.annotations as Annotation[] | undefined)?.map(annotation => ({
          id: annotation._id,
          ...(annotation.data as BoundingBox)
        })) || []
      );
      if (data.task.reviewNotes) {
        setReviewComment(data.task.reviewNotes);
      }
      setAiLabels(data.task.lastAiLabels || []);
    };
    fetchTask();
  }, [taskId]);

  const isReviewer = user?.role === 'Reviewer';

  /**
   * Adds a new bounding box whenever the annotator clicks on the canvas.
   */
  const handleStageClick = (_event: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReviewer) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    const newBox: BoundingBox = {
      id: crypto.randomUUID(),
      x: pointerPosition.x,
      y: pointerPosition.y,
      width: 120,
      height: 120
    };
    setBoxes(prev => [...prev, newBox]);
  };

  /**
   * Persists the annotation set to the API and releases the task lock.
   */
  const handleSave = async () => {
    if (!taskId) return;
    setStatus('Saving annotations...');
    try {
      await api.post(`/annotations/${taskId}`, {
        annotations: boxes
      });
      setTask(prev =>
        prev
          ? {
              ...prev,
              status: 'awaiting_review',
              reviewNotes: null,
              reviewedBy: null,
              reviewedAt: null
            }
          : prev
      );
      setStatus('Annotations saved!');
    } catch (error) {
      console.error(error);
      setStatus('Failed to save annotations');
    }
  };

  /**
   * Calls the AI endpoint (mock or AWS Rekognition) to seed the canvas with suggested bounding boxes.
   */
  const handleAutoAnnotate = async () => {
    if (!taskId) return;
    setStatus('Requesting AI pre-annotations...');
    try {
      const { data } = await api.post(`/ai/predict`, { taskId });
      setBoxes(data.annotations);
      setAiLabels(data.labels || []);
      setTask(prev =>
        prev
          ? {
              ...prev,
              lastAiModel: data.model,
              lastAiRunAt: new Date().toISOString(),
              lastAiLabels: data.labels || []
            }
          : prev
      );
      setStatus(`AI annotations loaded from ${data.model}. Review before saving.`);
    } catch (error) {
      console.error(error);
      setStatus('AI pre-annotation failed');
    }
  };

  /**
   * Marks the task as reviewer-approved and broadcasts the decision.
   */
  const handleApprove = async () => {
    if (!taskId) return;
    setStatus('Approving task...');
    try {
      const { data } = await api.post(`/annotations/${taskId}/review`, {
        decision: 'approved'
      });
      setTask(data.task);
      setReviewComment('');
      setStatus('Task approved and archived.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to approve task');
    }
  };

  /**
   * Requests additional changes from the annotator while persisting notes.
   */
  const handleReject = async () => {
    if (!taskId) return;
    setStatus('Sending review feedback...');
    try {
      const { data } = await api.post(`/annotations/${taskId}/review`, {
        decision: 'rejected',
        notes: reviewComment
      });
      setTask(data.task);
      setReviewComment(data.task.reviewNotes || '');
      setStatus('Changes requested from annotator.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to submit review');
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <h2>Annotating task {taskId}</h2>
        <div className="page__actions">
          {!isReviewer && (
            <>
              <button onClick={handleAutoAnnotate}>Auto annotate</button>
              <button onClick={handleSave}>Save</button>
            </>
          )}
          {isReviewer && (
            <>
              <button onClick={handleApprove}>Approve</button>
              <button onClick={handleReject}>Request changes</button>
            </>
          )}
        </div>
      </header>
      {task?.status === 'rejected' && !isReviewer && task.reviewNotes && (
        <div className="banner banner--warning">
          <strong>Reviewer feedback:</strong> {task.reviewNotes}
        </div>
      )}
      {imageUrl ? (
        <div className="annotation-stage">
          <img src={imageUrl} alt="Task preview" className="annotation-stage__image" />
          <Stage
            className="annotation-stage__canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleStageClick}
            ref={stageRef}
          >
            <Layer>
              {boxes.map(box => (
                <Rect
                  key={box.id}
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  stroke="red"
                />
              ))}
              {boxes.map(box => (
                box.label ? (
                  <Text
                    key={`${box.id}-label`}
                    x={box.x}
                    y={Math.max(0, box.y - 18)}
                    text={`${box.label}${box.confidence ? ` (${box.confidence}%)` : ''}`}
                    fill="yellow"
                    fontStyle="bold"
                    shadowColor="black"
                    shadowBlur={4}
                    shadowOpacity={0.6}
                  />
                ) : null
              ))}
            </Layer>
          </Stage>
        </div>
      ) : (
        <p>Preview unavailable. Check S3 configuration.</p>
      )}
      {aiLabels.length > 0 && (
        <section className="card annotation-ai-output">
          <h3>AI-detected labels</h3>
          <ul>
            {aiLabels.map(label => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>
      )}
      {isReviewer && (
        <section className="card annotation-review">
          <h3>Review notes</h3>
          <textarea
            value={reviewComment}
            onChange={event => setReviewComment(event.target.value)}
            placeholder="Optional feedback for the annotator"
            rows={4}
          />
        </section>
      )}
      {status && <p>{status}</p>}
    </div>
  );
};

export default AnnotationPage;
