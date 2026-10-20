from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from pypdf import PdfReader

rows = [
[
'Now is the best time to pause AI',
'The benefits of open-weight frontier AI outweigh the risks.',
'The US government can be trusted with superintelligence',
'AI safety research currently accelerates capabilities more than it improves safety.',
'AI will be the most important issue in the 2028 elections',
],
[
'Future AI systems could deserve moral consideration.',
'Chinese progress is mostly distillation',
'Grassroots advocacy is more important than any other political strategy for AI safety',
'There will be a significant software-only singularity',
'The government should grant antitrust exemptions to frontier labs',
],
[
'Working at a frontier lab is one of the best ways to reduce AI existential risk.',
'An international pause on frontier AI could be effectively enforced.',
'AI is important',
'Stronger chip export controls would make the world safer.',
'We will get more warning shots',
],
[
'We should focus on state regulations more than federal regulations for AI',
'AGI by 2030',
'Lab CEOs are disingenuous with their calls for regulation',
'AI welfare concerns should influence how we train advanced systems.',
'Authoritarian governments reaching transformative AI before democratic governments is a bigger risk than losing control of AI',
],
[
'A permanent ban on superintelligence would be better than accepting a 10% risk of human extinction.',
'The US government should pace the frontier by mandating percentages of compute used for inference',
'Military use of frontier AI should be prohibited.',
'A pause is better than a slow down, assuming both are well executed',
'We should prioritize domestic regulation before international regulation',
],
]
path='output/pdf/speed-updating-board.pdf'
c=canvas.Canvas(path,pagesize=landscape(letter))
c.setTitle('Speed Updating | AI Policy, Governance & Safety')
c.setAuthor('')
W,H=landscape(letter)
margin=25
c.setFillColor(HexColor('#111111'))
c.setFont('Helvetica-Bold',21)
c.drawString(margin,H-35,'SPEED UPDATING')
c.setFont('Helvetica',10)
c.drawString(margin,H-51,'AI policy, governance & existential risk')
c.setFont('Helvetica',9)
c.drawRightString(W-margin,H-34,'Name: __________________________')

c.setFont('Helvetica-Bold',9)
c.drawString(margin,H-70,'1  Strongly disagree     2  Disagree     3  Neutral / unsure     4  Agree     5  Strongly agree')
left=margin; top=H-82; bottom=25
cw=(W-2*margin)/5; ch=(top-bottom)/5
style=ParagraphStyle('claim',fontName='Helvetica',fontSize=10.3,leading=12.2,textColor=HexColor('#111111'))
for r,row in enumerate(rows):
    for col,claim in enumerate(row):
        x=left+col*cw; y=top-(r+1)*ch
        free=r==2 and col==2
        if free:
            c.setFillColor(HexColor('#f0f0f0')); c.rect(x,y,cw,ch,fill=1,stroke=0)
        c.setStrokeColor(HexColor('#555555')); c.setLineWidth(.6); c.rect(x,y,cw,ch,fill=0,stroke=1)
        tx=x+9; ty=y+ch-10
        if free:
            c.setFont('Helvetica-Bold',8); c.setFillColor(HexColor('#555555'))
            c.drawString(tx,ty-7,'FREE SPACE'); ty-=19
        p=Paragraph(claim.rstrip('.!?') + '.',style)
        pw,ph=p.wrap(cw-18,ch)
        assert ph <= ty-(y+26), (claim,ph,ty-(y+26))
        p.drawOn(c,tx,ty-ph)
        c.setFillColor(HexColor('#333333')); c.setFont('Helvetica',8)
        c.drawString(tx,y+10,'Start ___   R1 ___   R2 ___   R3 ___')
c.setFont('Helvetica',7.5); c.setFillColor(HexColor('#555555'))

c.save()
reader=PdfReader(path)
assert len(reader.pages)==1
extracted=reader.pages[0].extract_text()
for row in rows:
    for claim in row:
        assert ' '.join(claim.split()) in ' '.join(extracted.split()),claim
print('Created and verified: 1 page, all 25 claims, 4 rating fields per square.')
